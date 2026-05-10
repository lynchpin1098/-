import { useRef, useCallback } from "react";

export function useDebounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  const timerRef = useRef<number>(0);

  return useCallback(
    (...args: unknown[]) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay]
  ) as T;
}
