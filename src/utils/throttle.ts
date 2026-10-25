export interface Throttled<A extends unknown[]> {
  (...args: A): void
  /** Run the pending call right now (e.g. before the page is closed). */
  flush: () => void
  /** Drop the pending call. */
  cancel: () => void
}

/**
 * Trailing throttle: calls `fn` at most once per `ms`, with the latest arguments.
 * Bursts of updates (typing, dragging) become a single write.
 */
export function throttle<A extends unknown[]>(fn: (...args: A) => void, ms: number): Throttled<A> {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pendingArgs: A | undefined

  const run = () => {
    timer = undefined
    if (!pendingArgs) return
    const args = pendingArgs
    pendingArgs = undefined
    fn(...args)
  }

  const throttled = (...args: A) => {
    pendingArgs = args
    timer ??= setTimeout(run, ms)
  }

  throttled.flush = () => {
    if (timer) clearTimeout(timer)
    run()
  }

  throttled.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
    pendingArgs = undefined
  }

  return throttled
}
