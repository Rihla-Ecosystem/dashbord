import { AuthProvider } from "@/features/auth/auth-context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/10 via-background to-background" />
        <div className="pointer-events-none absolute -left-40 top-20 size-80 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-20 size-80 rounded-full bg-accent-orange/10 blur-3xl" />
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </div>
    </AuthProvider>
  );
}
