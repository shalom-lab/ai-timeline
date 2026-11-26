import { Component, type ReactNode } from 'react'

export default class GalleryBoundary extends Component<{ children: ReactNode; onReturn: () => void }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="gallery-fallback">
        <h2>3D 展厅暂时无法加载</h2>
        <p>当前浏览器无法运行 3D 展厅。你仍可在时间线阅读同一批事件和出处。</p>
        <button type="button" onClick={this.props.onReturn}>返回时间线</button>
      </main>
    )
  }
}
