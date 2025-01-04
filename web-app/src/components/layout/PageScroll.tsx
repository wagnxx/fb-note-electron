import React, { FC, ReactNode } from 'react'

interface PropsType {
  header: ReactNode // 顶部固定的 header 内容
  children: ReactNode // 滚动区域内容
  styles?: React.CSSProperties // 外层容器的样式
  contentStyles?: React.CSSProperties // 滚动区域的样式
  footer?: ReactNode
  footerHeight?: number
}

const PageScroll: FC<PropsType> = ({
  header,
  children,
  footer,
  footerHeight = 50,
  styles = {},
  contentStyles = {},
}) => {
  return (
    <div className="flex flex-1 flex-col" style={{ ...styles }}>
      {/* Header 部分 */}
      <div className="header" style={{ flexShrink: 0 }}>
        {header}
      </div>

      {/* Content 滚动区域 */}
      <div
        className="content flex-1 overflow-y-auto"
        style={{
          ...contentStyles,
        }}
      >
        {children}
      </div>

      {/* 固定 Footer 部分 */}
      <div
        className="footer"
        style={{
          flexShrink: 0,
          height: footerHeight, // 保留 footer 的高度
          backgroundColor: footer ? undefined : 'transparent', // 无 footer 时透明
        }}
      >
        {footer}
      </div>
    </div>
  )
}

export default PageScroll
