"use client";

import { useCallback, useState } from "react";

type ResetState<T> = { value: T; sent: T; key: number };

/**
 * For a filter field that keeps its own text (search box, Sunner combobox, date inputs): returns a
 * `key` that changes only when `value` changes to something this field did not send itself (e.g.
 * "Xoá bộ lọc" or browser back), so keying the field remounts it with the new value while the
 * user's own edits never reset what they are typing. Call `markSent(v)` right before sending `v`.
 */
export function useExternalResetKey<T>(value: T): [key: number, markSent: (sent: T) => void] {
  const [state, setState] = useState<ResetState<T>>({ value, sent: value, key: 0 });
  // Adjusting state while rendering (React "storing information from previous renders" pattern).
  if (!Object.is(state.value, value)) {
    setState({ value, sent: state.sent, key: Object.is(value, state.sent) ? state.key : state.key + 1 });
  }
  const markSent = useCallback((sent: T) => setState((current) => ({ ...current, sent })), []);
  return [state.key, markSent];
}
