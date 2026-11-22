/**
 * Which Hero tooltip is open on the page (DEC-003: one at a time). Plain module state read through
 * `useSyncExternalStore`; written only from event handlers. Opening one tooltip replaces the
 * previous one; a close from any other tooltip is ignored.
 */
let activeId: string | null = null;
const listeners = new Set<() => void>();

function setActive(next: string | null): void {
  if (next === activeId) return;
  activeId = next;
  for (const listener of listeners) listener();
}

export function subscribeActiveHeroTooltip(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readActiveHeroTooltip(): string | null {
  return activeId;
}

export function openHeroTooltip(id: string): void {
  setActive(id);
}

export function closeHeroTooltip(id: string): void {
  if (activeId === id) setActive(null);
}
