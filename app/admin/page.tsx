import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/shared/ui/app-routes";

export default function AdminIndexPage() {
  redirect(ADMIN_ROUTES.overview);
}
