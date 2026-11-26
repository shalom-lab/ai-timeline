#!/usr/bin/env python3
"""Collect public feed titles/links for human review. Never edit the timeline."""
from argparse import ArgumentParser
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from gzip import GzipFile
from html import unescape
from html.parser import HTMLParser
from io import BytesIO
import json
from pathlib import Path
import re
from urllib.parse import parse_qsl, urlencode, urljoin, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 4 * 1024 * 1024
TRACKING = frozenset(("fbclid", "gclid", "mc_cid", "mc_eid", "ref_src", "ref_url", "_hsenc", "_hsmi"))
KIND_RANK = {"official-feed": 0, "official-link-from-newsletter": 1, "platform-feed": 2, "newsletter-edition": 3}


def normalize_url(value, base=""):
    value = value.strip()
    if not value or len(value) > 1600 or any(ord(ch) <= 32 for ch in value) or "\\" in value:
        return None
    try:
        url = urlsplit(urljoin(base, value))
        if url.scheme not in {"https", "http"} or not url.hostname or url.username or url.password:
            return None
        host = url.hostname.removeprefix("www.").lower()
        if not re.fullmatch(r"[a-z0-9.-]+\.[a-z]{2,}", host):
            return None
        if url.port not in (None, 80 if url.scheme == "http" else 443):
            return None
        query = urlencode(sorted(
            (k, v) for k, v in parse_qsl(url.query, keep_blank_values=True)
            if k.casefold() not in TRACKING and not k.casefold().startswith("utm_")
        ))
        return urlunsplit(("https", host, url.path.rstrip("/") or "/", query, url.fragment))
    except ValueError:
        return None


def output_url(value, base=""):
    # Preserve working publisher host/path for readers; normalize only the comparison key.
    value = value.strip()
    if not value or any(ord(ch) <= 32 for ch in value):
        return None
    try:
        joined = urljoin(base, value)
        return joined if urlsplit(joined).scheme == "https" and normalize_url(joined) else None
    except ValueError:
        return None


def parse_day(raw):
    raw = raw.strip()
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).date()
    except ValueError:
        pass
    try:
        return parsedate_to_datetime(raw).date()
    except (TypeError, ValueError, OverflowError):
        return None


class SafeRedirect(HTTPRedirectHandler):
    max_redirections = 3

    def __init__(self, original):
        self.hostname = urlsplit(original).hostname.removeprefix("www.").casefold()

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        parsed = urlsplit(newurl)
        if (parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password
                or parsed.port not in (443, None)
                or parsed.hostname.removeprefix("www.").casefold() != self.hostname):
            raise ValueError("feed redirected outside its configured HTTPS host")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch(feed):
    url = feed["url"]
    if not output_url(url):
        raise ValueError("invalid configured feed URL")
    request = Request(url, headers={
        "User-Agent": "AI-Timeline-discovery/1.0 (+https://github.com/shalom-lab/ai-timeline)",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9",
    })
    with build_opener(SafeRedirect(url)).open(request, timeout=12) as response:
        return response.read(MAX_BYTES + 1), response.geturl()


def local_name(tag):
    return tag.rsplit("}", 1)[-1]


def text(element, *tags):
    for tag in tags:
        for child in element:
            if local_name(child.tag) == tag and child.text:
                return child.text
    return ""


def compact(value, limit=200):
    # Remove controls and bidi overrides; never render feed HTML in the report.
    return " ".join(re.sub(r"[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]", " ", unescape(value)).split())[:limit]


class Anchors(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
        self.current = None
        self.words = []

    def handle_starttag(self, tag, attrs):
        if tag == "a" and len(self.links) < 300:
            self.current = dict(attrs).get("href")
            self.words = []

    def handle_data(self, data):
        if self.current and len(self.words) < 20:
            self.words.append(data[:200])

    def handle_endtag(self, tag):
        if tag == "a" and self.current:
            self.links.append((self.current, compact(" ".join(self.words))))
            self.current = None


def official_target(url, config):
    parsed = urlsplit(url)
    host = parsed.hostname
    path = parsed.path.strip("/")
    if host == "github.com":
        owner, _, remaining = path.partition("/")
        return owner.casefold() in config["officialGitHubOwners"] and (
            "/releases/tag/" in remaining or "/blob/" in remaining or "/commit/" in remaining
        )
    if host not in config["officialLinkHosts"] and not any(
        host.endswith("." + item) for item in config["officialLinkHosts"]
    ):
        return False
    return bool(path) and "/" in path and path.casefold() not in {
        "api/pricing", "en-us", "news/rss.xml", "blog/rss.xml", "docs/overview",
    }


def parse_feed(payload, base):
    if len(payload) > MAX_BYTES:
        raise ValueError("feed exceeded size limit")
    # Some public feeds deliver gzip even without Accept-Encoding.
    if payload.startswith(b"\x1f\x8b"):
        with GzipFile(fileobj=BytesIO(payload)) as compressed:
            payload = compressed.read(MAX_BYTES + 1)
        if len(payload) > MAX_BYTES:
            raise ValueError("decompressed feed exceeded size limit")
    xml = payload.decode("utf-8-sig")
    # A few feeds leak legacy text separators into CDATA; remove only characters
    # forbidden by XML 1.0. Check DTD/entity declarations again after normalization.
    xml = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]", " ", xml)
    if re.search(r"<!\s*(?:DOCTYPE|ENTITY)\b", xml, re.I):
        raise ValueError("feed XML contains a DTD or entity declaration")
    root = ET.fromstring(xml)
    family = local_name(root.tag)
    if family == "rss":
        channel = root.find("channel")
        if channel is None:
            raise ValueError("RSS channel missing")
        items = [e for e in channel if local_name(e.tag) == "item"]
    elif family == "feed":
        items = [e for e in root if local_name(e.tag) == "entry"]
    else:
        raise ValueError("not an RSS 2.0 or Atom feed")
    for item in items[:150]:
        title = compact(text(item, "title"))
        date_observed = parse_day(text(item, "pubDate", "published", "date", "updated"))
        link = None
        for child in item:
            if local_name(child.tag) == "link" and child.attrib.get("rel", "alternate") == "alternate":
                link = output_url(child.attrib.get("href") or child.text or "", base)
                if link:
                    break
        if title and link and date_observed:
            yield title, date_observed, link, text(item, "encoded", "content", "description", "summary")


def collect(feed, config, cutoff, today):
    candidates = []
    payload, base = fetch(feed)
    for title, observed, link, html_body in parse_feed(payload, base):
        if not (cutoff <= observed <= today) or (
            feed.get("titlePattern") and not re.search(feed["titlePattern"], title)
        ) or any(urlsplit(link).path.startswith(prefix) for prefix in feed.get("excludePathPrefix", [])):
            continue
        kind = {"official": "official-feed", "platform": "platform-feed", "newsletter": "newsletter-edition"}[feed["kind"]]
        candidates.append((link, title, observed, kind, feed["name"], link))
        # Newsletter editions are lead discovery, not evidence of release date.
        # Only collect links to known publishers; never issue requests to item URLs.
        if feed["kind"] == "newsletter" and html_body:
            parser = Anchors()
            parser.feed(html_body[:150_000])
            seen = set()
            for href, label in parser.links:
                target = output_url(href, link)
                normalized = normalize_url(target) if target else None
                if normalized and normalized not in seen and official_target(normalized, config):
                    seen.add(normalized)
                    candidates.append((target, label or title, observed, "official-link-from-newsletter", feed["name"], link))
                    if len(seen) >= 12:
                        break
    return candidates


def merge(candidates, known):
    by_url = {}
    skipped_known = set()
    for link, title, observed, kind, source, lead in candidates:
        key = normalize_url(link)
        # A previously cited article containing new details can still be added manually.
        if key in known:
            skipped_known.add(key)
            continue
        item = by_url.setdefault(key, {"url": link, "title": title, "observedDate": observed.isoformat(),
                                       "kind": kind, "observations": []})
        evidence = {"kind": kind, "source": source, "observedDate": observed.isoformat(), "discoveredAt": lead}
        if evidence not in item["observations"]:
            item["observations"].append(evidence)
        best = KIND_RANK[kind] < KIND_RANK[item["kind"]]
        same_kind_newer = kind == item["kind"] and observed.isoformat() > item["observedDate"]
        if best or same_kind_newer:
            item.update(url=link, title=title, observedDate=observed.isoformat(), kind=kind)
    by_recency = sorted(by_url.values(), key=lambda item: item["observedDate"], reverse=True)
    return sorted(by_recency, key=lambda item: KIND_RANK[item["kind"]]), len(skipped_known)


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--days", type=int, default=14, choices=range(1, 91), metavar="1..90")
    parser.add_argument("--as-of", type=date.fromisoformat, default=datetime.now(timezone.utc).date())
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    config = json.loads((ROOT / "config/discovery-sources.json").read_text())
    timeline = json.loads((ROOT / "data/timeline.json").read_text())
    known = {normalize_url(source["url"]) for event in timeline["events"] for source in event["sources"]}
    cutoff = args.as_of - timedelta(days=args.days - 1)
    gathered, health = [], []
    with ThreadPoolExecutor(max_workers=6) as pool:
        jobs = [(f, pool.submit(collect, f, config, cutoff, args.as_of)) for f in config["feeds"]]
        for f, task in jobs:
            audit = {"name": f["name"], "url": f["url"], "kind": f["kind"]}
            try:
                candidates = task.result()
                gathered.extend(candidates)
                audit.update(status="ok", hits=len(candidates))
            except (OSError, ValueError, EOFError, ET.ParseError) as err:
                audit.update(status="error", failure=compact(str(err), 140))
            health.append(audit)
    ranked, skipped_known = merge(gathered, known)
    # Cap each source class independently so an official-feed spike does not hide newsletters.
    limits = dict(zip(KIND_RANK, (90, 40, 25, 25), strict=True))
    shown = []
    for item in ranked:
        if limits[item["kind"]] > 0:
            shown.append(item)
            limits[item["kind"]] -= 1
    report = {"reviewState": "unverified", "windowStart": cutoff.isoformat(), "windowEnd": args.as_of.isoformat(),
              "alreadyCitedDistinctUrls": skipped_known, "newDistinctUrlsBeforeCap": len(ranked),
              "feedHealth": health, "candidates": shown, "manualOfficialSources": config["manualOfficialSources"]}
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "candidates.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [f"AI 纪年待审候选：{cutoff} 至 {args.as_of}",
             "仅供发现线索。观察日期是消息/期刊日期，不是事件日期；不自动写入纪年。",
             "审校规则：docs/EDITORIAL-REVIEW.md",
             "先核一手原文，再找发布日志、模型卡、版本记录或独立原始证据，核对日期、对象、开放渠道和阶段。",
             "转载共用同一原文不算独立证据；证据冲突或关键细节无法核实就留在待审。",
             "复核后再按机构+产品+阶段+日期查重和选编。",
             "同一官方链接若涵盖多个事件，可在人工核对后继续使用。", "",
             f"候选：{len(shown)}／{len(ranked)} 个；排除已有来源网址：{skipped_known} 个。", ""]
    headers = {
        "official-feed": "直接来自机构订阅源",
        "official-link-from-newsletter": "从新闻简报发现的官方链接（仍需核对）",
        "platform-feed": "平台投稿与机构博客混合源",
        "newsletter-edition": "新闻简报与媒体入口",
    }
    for kind, label in headers.items():
        lines += [label, "=" * 28]
        for item in (entry for entry in shown if entry["kind"] == kind):
            obs = item["observations"]
            lines += [f"{item['observedDate']}  {item['title']}", f"  {item['url']}",
                      "  线索来源：" + "、".join(dict.fromkeys(o["source"] for o in obs))]
        lines.append("")
    lines += ["订阅源状态", "=" * 28]
    lines += [f"{f['name']}: {f['status']} ({f.get('hits', f.get('failure'))})" for f in health]
    lines += ["", "补查入口（未参与本次 RSS 抓取）", "=" * 28]
    lines += [f"{s['name']}: {s['url']}" for s in config["manualOfficialSources"]]
    (args.out / "REVIEW.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    ok = sum(f["status"] == "ok" for f in health)
    print(f"discovery: {ok}/{len(health)} feeds parsed, {len(shown)} review candidates, {skipped_known} cited URLs")
    if not ok:
        raise SystemExit("No feeds could be parsed; review the diagnostic artifact.")


if __name__ == "__main__":
    main()
