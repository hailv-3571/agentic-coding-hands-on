import { ForbiddenPanel } from "@/features/app-shell/components/forbidden-panel";

/** Rendered when a guard calls `forbidden()`. Bare page: no admin markup (SC-004). */
export default function Forbidden() {
  return <ForbiddenPanel />;
}
