"""Offline regression checks for discovery. No network or repository writes."""
from datetime import date
from gzip import compress
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import unittest
from unittest.mock import patch

spec = spec_from_file_location("discover_candidates", Path(__file__).with_name("discover-candidates.py"))
discovery = module_from_spec(spec)
spec.loader.exec_module(discovery)

RSS = b"""<rss version="2.0"><channel>
<item><title>France &amp; tools</title><link>https://newsletter.example/a</link>
<pubDate>Wed, 25 Nov 2026 01:00:00 GMT</pubDate>
<description><![CDATA[<a href="https://www.openai.com/index/example/?utm_source=newsletter">Release <b>notes</b></a>
<a href="https://github.com/qwenlm/model/releases/tag/v1">Tag</a>
<a href="https://github.com/unknown/model/releases/tag/v1">Unknown tag</a>
<a href="https://openai.com.evildoer.com/index/example">Spoofed</a>
<a href="https://openai.com/api/pricing">Pricing</a>
<a href="https://[malformed">Bad</a>
<a href="javascript:alert(0)">No</a>]]></description></item>
<item><title>Old issue</title><link>https://newsletter.example/old</link><pubDate>Wed, 25 Nov 2025 01:00:00 GMT</pubDate></item>
<item><title>Malformed link</title><link>https://[bad</link><pubDate>Wed, 25 Nov 2026 01:00:00 GMT</pubDate></item>
<item><title>No date</title><link>https://newsletter.example/no-date</link></item>
</channel></rss>"""
ATOM = b"""<feed xmlns="http://www.w3.org/2005/Atom"><entry>
<title>New model launch</title><link rel="self" href="https://somewhere.example/self"/>
<link href="/index/example/" rel="alternate"/><updated>2026-11-30T01:00:00Z</updated>
<published>2026-11-25T01:00:00Z</published></entry></feed>"""


class DiscoveryTest(unittest.TestCase):
    def test_priority_surfaces_math_and_newsletter_outside_official_feeds(self):
        rows = [
            {"title": "v2.1.332", "observedDate": "2026-11-25", "observations": [{"source": "Claude Code Releases"}]},
            {"title": "Riemann proof", "observedDate": "2026-11-20", "observations": [{"source": "TLDR AI"}]},
            {"title": "A quote from Levent Alpöge", "observedDate": "2026-11-20", "observations": [{"source": "Simon Willison · Mathematics"}]},
        ]
        self.assertEqual(discovery.priority_review(rows), rows[1:])

    def test_rss_and_malformed_items(self):
        parsed = list(discovery.parse_feed(RSS, "https://newsletter.example/feed"))
        self.assertEqual(len(parsed), 2)
        self.assertEqual(parsed[0][:3], ("France & tools", date(2026, 11, 25), "https://newsletter.example/a"))

    def test_atom_published_preferred_and_relative_link(self):
        parsed = list(discovery.parse_feed(ATOM, "https://openai.com/feed"))
        self.assertEqual(parsed[0][:3], ("New model launch", date(2026, 11, 25), "https://openai.com/index/example/"))

    def test_no_untrusted_destinations_and_no_date_laundering(self):
        conf = {"officialLinkHosts": ["openai.com"], "officialGitHubOwners": ["qwenlm"]}
        spec = {"name": "AI digest", "kind": "newsletter", "url": "https://newsletter.example/feed"}
        with patch.object(discovery, "fetch", return_value=(RSS, spec["url"])) as fetch:
            items = discovery.collect(spec, conf, date(2026, 11, 12), date(2026, 11, 26))
        fetch.assert_called_once_with(spec)
        self.assertEqual([i[1] for i in items], ["France & tools", "Release notes", "Tag"])
        self.assertEqual(items[1][3:], ("official-link-from-newsletter", "AI digest", "https://newsletter.example/a"))
        self.assertEqual(items[1][2], date(2026, 11, 25))

    def test_dedup_prefers_primary_while_retaining_leads(self):
        d = date(2026, 11, 25)
        matching = "https://www.openai.com/index/example/?utm_source=email&a=1"
        primary = "https://openai.com/index/example?a=1"
        other = "https://openai.com/index/known/"
        raw = [(matching, "Digest", d, "official-link-from-newsletter", "Digest", matching),
               (primary, "First-party title", d, "official-feed", "Lab", primary),
               (other, "Known article", d, "official-feed", "Lab", other)]
        result, known_count = discovery.merge(raw, {discovery.normalize_url(other)})
        self.assertEqual(known_count, 1)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["title"], "First-party title")
        self.assertEqual({row["source"] for row in result[0]["observations"]}, {"Digest", "Lab"})

    def test_cited_official_recheck_separate_from_new_and_newsletter_only(self):
        original = "https://openai.com/index/original"
        second = "https://openai.com/index/older"
        reshare = "https://openai.com/index/reshared"
        d_now = date(2026, 11, 25)
        d_old = date(2026, 11, 22)
        refs = {each: {"z-id", "a-id"} for each in (original, second, reshare)}
        rows = [
            (original + "/?utm_source=x", "Current", d_now, "official-feed", "Lab", original),
            (original, "Current", d_now, "official-feed", "Lab duplicate", original),
            (second, "Earlier", d_old, "official-feed", "Lab", second),
            (reshare, "An old story", d_now, "official-link-from-newsletter", "Digest", reshare),
        ]
        new, excluded = discovery.merge(rows, set(refs))
        self.assertEqual((new, excluded), ([], 3))
        review, total = discovery.previously_cited_for_review(rows, refs, limit=1)
        self.assertEqual(total, 2)
        self.assertEqual(len(review), 1)
        self.assertEqual(review[0]["title"], "Current")
        self.assertEqual(review[0]["citedByEventIds"], ["a-id", "z-id"])
        self.assertEqual(len(review[0]["observations"]), 2)

    def test_safety_limits(self):
        with self.assertRaisesRegex(ValueError, "DTD"):
            list(discovery.parse_feed(b'<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>', ""))
        with self.assertRaisesRegex(ValueError, "size"):
            list(discovery.parse_feed(b"x" * (discovery.MAX_BYTES + 1), ""))
        for invalid in ["", "javascript:alert(1)", "https://trusted.example@invalid.example/", "https://[bad", "https://trusted.example:1234/x"]:
            self.assertIsNone(discovery.output_url(invalid, "https://trusted.example/base"))
        with self.assertRaisesRegex(ValueError, "redirected"):
            discovery.SafeRedirect("https://trusted.example/feed").redirect_request(None, None, 301, "", {}, "https://different.example/archive")

    def test_gzip_and_illegal_xml_separator(self):
        body = RSS.replace(b"France &amp;", b"France\x1e&amp;")
        parsed = list(discovery.parse_feed(compress(body), "https://newsletter.example/feed"))
        self.assertEqual(parsed[0][0], "France & tools")
        with self.assertRaisesRegex(ValueError, "decompressed"):
            list(discovery.parse_feed(compress(b"x" * (discovery.MAX_BYTES + 1)), ""))

    def test_title_bidi_controls_removed(self):
        self.assertEqual(discovery.compact("fake\u202ehidden"), "fake hidden")


if __name__ == "__main__":
    unittest.main()
