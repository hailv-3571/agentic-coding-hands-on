"use client";

import { useEffect, useRef } from "react";
import { onNotificationSync, type NotificationSyncKind } from "../lib/notification-sync-events";

/** Subscribes `listener` (latest render's) to sync events from other sources while mounted. */
export function useNotificationSync(source: string, listener: (kind: NotificationSyncKind) => void): void {
  const listenerRef = useRef(listener);
  useEffect(() => {
    listenerRef.current = listener;
  });
  useEffect(() => onNotificationSync(source, (kind) => listenerRef.current(kind)), [source]);
}
