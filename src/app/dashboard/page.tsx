import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/dashboard/admin");
  redirect("/dashboard/client");
}
