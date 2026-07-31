import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
        <ShieldX className="size-10 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold">403 — Forbidden</h1>
      <p className="max-w-md text-muted-foreground">
        You don&apos;t have permission to access this page. Contact an administrator if you believe this is an error.
      </p>
      <Button render={<Link href="/dashboard" />} className="rounded-xl">
        Back to Dashboard
      </Button>
    </div>
  );
}
