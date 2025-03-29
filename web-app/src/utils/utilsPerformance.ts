export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = { leading: true, trailing: true },
): (...args: Parameters<T>) => void {
  let lastTime = 0
  let timer: number | null = null // 👈 改为 number | null

  return function (...args: Parameters<T>) {
    const now = Date.now()

    if (!lastTime && options.leading === false) {
      lastTime = now
    }

    const remaining = delay - (now - lastTime)

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      lastTime = now
      fn(...args)
    } else if (!timer && options.trailing !== false) {
      timer = window.setTimeout(() => {
        // 👈 使用 window.setTimeout
        lastTime = options.leading === false ? 0 : Date.now()
        timer = null
        fn(...args)
      }, remaining)
    }
  }
}
