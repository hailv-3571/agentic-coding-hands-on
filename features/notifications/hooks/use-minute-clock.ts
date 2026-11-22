"use client";

import { useEffect, useState } from "react";

/** "Now" for relative times, refreshed every minute so "Vừa xong" turns into "1 phút trước". */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
