import { RoleGuard } from "@/features/auth/role-guard";

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard roles={["ADMIN"]}>{children}</RoleGuard>;
}
