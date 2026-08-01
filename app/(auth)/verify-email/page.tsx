"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authApi } from "@/services/api";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CheckCircle, XCircle } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");

  useEffect(() => {
    if (!token) {
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <Card className="rounded-2xl border-border/50 shadow-xl backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Email Verification</CardTitle>
        <CardDescription>
          {status === "loading" && "Verifying your email..."}
          {status === "success" && "Your email has been verified"}
          {status === "error" && "Verification failed or link expired"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {status === "loading" && <LoadingSpinner size="lg" />}
        {status === "success" && <CheckCircle className="size-16 text-emerald-500" />}
        {status === "error" && <XCircle className="size-16 text-destructive" />}
        {status !== "loading" && (
          <Button nativeButton={false} render={<Link href="/login" />} className="rounded-xl">
            Continue to login
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="py-20" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
