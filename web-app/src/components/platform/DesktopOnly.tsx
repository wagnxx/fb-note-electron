import { isElectron } from '@/utils/utilsSystem'
import React from 'react'

// 判断是否是 Electron 环境
// const isElectron = () => {
//   return typeof window !== 'undefined' && window.process && window.process.type === 'renderer'
// }

// 判断是否是桌面平台（包括 Electron 和其他桌面浏览器）
const isDesktop = () => {
  const userAgent = window.navigator.userAgent.toLowerCase()
  return isElectron() || /windows|mac|linux/i.test(userAgent)
}

type DesktopOnlyProps = {
  fallback?: React.ReactNode
  children: React.ReactNode
}

const DesktopOnly: React.FC<DesktopOnlyProps> = ({
  fallback = 'Not supported in web environment',
  children,
}) => {
  return <>{isElectron() ? children : fallback}</>
}

export default DesktopOnly
