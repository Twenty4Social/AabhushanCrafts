import { requireAdminSession } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession("/admin");
  return children;
}
