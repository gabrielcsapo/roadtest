import { useState, useCallback, useRef } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseAsyncReturn<T, Args extends unknown[]> extends AsyncState<T> {
  execute: (...args: Args) => Promise<void>;
  reset: () => void;
}

const initialState = <T>(): AsyncState<T> => ({
  data: null,
  loading: false,
  error: null,
});

export function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
): UseAsyncReturn<T, Args> {
  const [state, setState] = useState<AsyncState<T>>(initialState<T>());
  const mountedRef = useRef(true);

  const execute = useCallback(
    async (...args: Args) => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await asyncFn(...args);
        if (mountedRef.current) {
          setState({ data: result, loading: false, error: null });
        }
      } catch (err) {
        if (mountedRef.current) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      }
    },
    [asyncFn],
  );

  const reset = useCallback(() => {
    setState(initialState<T>());
  }, []);

  return { ...state, execute, reset };
}
