import { RoleGuard } from "@/features/auth/role-guard";

export default function TokenPackagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard roles={["ADMIN"]}>{children}</RoleGuard>;
}
