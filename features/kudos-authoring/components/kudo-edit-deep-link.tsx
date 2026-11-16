"use client";

import { useState } from "react";
import { KudoComposerModal } from "./kudo-composer-modal";

/**
 * Opens the composer in edit mode for `/?editKudo={id}` (placeholder home only). Phase 05 adds
 * the real entry — the edit button on the owner's Kudo card — and should remove this. The edit
 * route still enforces ownership. The id is captured once, so the modal and its success toast
 * survive the route refresh after saving; closing strips the query without a server round trip.
 */
export function KudoEditDeepLink({ kudoId }: { kudoId: string | null }) {
  const [editId] = useState(kudoId);
  const [open, setOpen] = useState(kudoId !== null);
  if (!editId) return null;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) window.history.replaceState(null, "", window.location.pathname);
  }

  return <KudoComposerModal mode="edit" kudoId={editId} open={open} onOpenChange={handleOpenChange} />;
}
