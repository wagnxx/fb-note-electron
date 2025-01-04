import { useEffect, useRef } from 'react'

// 创建 useFirstRender 自定义 Hook
const useFirstRender = () => {
  const isFirstRender = useRef(true)

  // 当组件首次渲染时，将 isFirstRender 设置为 false
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
    }
  }, [])

  return isFirstRender.current
}

export default useFirstRender
