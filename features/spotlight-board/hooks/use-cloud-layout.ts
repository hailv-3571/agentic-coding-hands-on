"use client";

import { useState } from "react";
import { layoutNameCloud, type CloudLayout, type CloudLayoutInput } from "../lib/spotlight-cloud-layout";

/**
 * Lays out the cloud whenever `input` changes, handing the previous layout back to ALG-001 so names
 * whose tier did not change keep their place. The previous layout is state from the last render
 * (React's "adjust state when a prop changes" pattern), so `input` must be memoized by the caller.
 */
export function useCloudLayout(input: CloudLayoutInput | null): CloudLayout | null {
  const [memo, setMemo] = useState<{ input: CloudLayoutInput | null; layout: CloudLayout | null }>({ input: null, layout: null });
  if (memo.input === input) return memo.layout;
  const layout = input ? layoutNameCloud(input, memo.layout) : null;
  setMemo({ input, layout });
  return layout;
}
