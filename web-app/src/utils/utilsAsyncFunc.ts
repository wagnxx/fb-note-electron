const resolvedPromise = /*#__PURE__*/ Promise.resolve() as Promise<any>
let currentFlushPromise: Promise<void> | null = null

export function nextTick<T = void>(this: T, fn?: (this: T) => void): Promise<void> {
  const p = currentFlushPromise || resolvedPromise

  return fn ? p.then(this ? fn.bind(this) : fn) : p
}

export function delayFor(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 这个方法只能在 Web 浏览器端使用，依赖于 `requestAnimationFrame`。
 * 它通过浏览器的动画帧机制来调度回调函数，并返回一个 Promise。
 *
 * @returns 返回一个 Promise，表示在下一帧时回调函数的执行。
 */
export function afterRaf() {
  if (typeof requestAnimationFrame !== 'function') {
    throw new Error('requestAnimationFrame is not available in this environment.')
  }
  return new Promise(resolve => requestAnimationFrame(resolve))
}
