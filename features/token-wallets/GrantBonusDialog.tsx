"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useGrantTokenBonus } from "@/hooks/useGrantTokenBonus";
import { FormSubmitError } from "./FormSubmitError";
import { MAX_TOKEN_BALANCE } from "@/constants";
import { formatNumber } from "@/utils";

const bonusSchema = z.object({
  tokens: z
    .string()
    .min(1, "Tokens is required")
    .regex(/^\d+$/, "Tokens must be a whole number")
    .refine((value) => Number(value) > 0, "Tokens must be greater than zero")
    .refine(
      (value) => Number(value) <= MAX_TOKEN_BALANCE,
      `Tokens must not exceed ${formatNumber(MAX_TOKEN_BALANCE)}`
    ),
  reason: z
    .string()
    .trim()
    .min(3, "Reason must be at least 3 characters")
    .max(500, "Reason must be at most 500 characters"),
});

type BonusFormValues = z.infer<typeof bonusSchema>;

type SubmissionIntent = { signature: string; idempotencyKey: string };

interface GrantBonusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentBalance: number;
  walletStatus: string;
}

export function GrantBonusDialog({
  open,
  onOpenChange,
  userId,
  userName,
  currentBalance,
  walletStatus,
}: GrantBonusDialogProps) {
  const grantBonus = useGrantTokenBonus();
  const [submissionIntent, setSubmissionIntent] = useState<SubmissionIntent | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<BonusFormValues>({
    resolver: zodResolver(bonusSchema),
    mode: "onChange",
    defaultValues: { tokens: "", reason: "" },
  });

  const tokensValue = useWatch({ control, name: "tokens" });
  const parsedTokens = /^\d+$/.test(tokensValue ?? "") ? Number(tokensValue) : null;
  const expectedBalance =
    parsedTokens !== null && Number.isFinite(parsedTokens)
      ? currentBalance + parsedTokens
      : null;

  const walletIsActive = walletStatus === "ACTIVE";
  const overBalanceLimit =
    expectedBalance !== null && expectedBalance > MAX_TOKEN_BALANCE;

  const isSubmitting = grantBonus.isPending;
  const canSubmit =
    isValid && isDirty && walletIsActive && !overBalanceLimit && !isSubmitting;

  const resetDialogState = () => {
    reset();
    grantBonus.reset();
    setSubmissionIntent(null);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetDialogState();
    onOpenChange(nextOpen);
  };

  const onSubmit = (data: BonusFormValues) => {
    const signature = `${Number(data.tokens)}|${data.reason.trim()}`;
    const intent = submissionIntent?.signature === signature
      ? submissionIntent
      : { signature, idempotencyKey: crypto.randomUUID() };
    if (intent !== submissionIntent) setSubmissionIntent(intent);

    grantBonus.mutate(
      {
        userId,
        input: {
          tokens: Number(data.tokens),
          reason: data.reason.trim(),
          idempotencyKey: intent.idempotencyKey,
        },
      },
      {
        onSuccess: (result) => {
          if (result.idempotentReplay) {
            toast.success("Bonus already applied (idempotent replay), no changes made");
          } else {
            toast.success(
              `Granted ${formatNumber(result.tokensGranted)} bonus tokens (${formatNumber(result.previousBalance)} → ${formatNumber(result.newBalance)})`
            );
          }
          resetDialogState();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Grant bonus tokens</DialogTitle>
          <DialogDescription>
            Add bonus tokens to the wallet of {userName || userId}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!walletIsActive && (
            <div className="rounded-xl border border-amber-600/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-500">
              This wallet is {walletStatus}. Bonus grants are disabled until the
              wallet is active again.
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Tokens</label>
            <Input
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 500"
              inputMode="numeric"
              className="rounded-xl"
              {...register("tokens")}
            />
            {errors.tokens && (
              <p className="text-xs text-destructive">{errors.tokens.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20"
              placeholder="Why is this bonus being granted?"
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-xs text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current balance</span>
              <span className="font-medium">{formatNumber(currentBalance)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tokens to grant</span>
              <span className="font-medium">
                {parsedTokens !== null ? `+${formatNumber(parsedTokens)}` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
              <span className="font-medium">Expected balance</span>
              <span className={overBalanceLimit ? "font-semibold text-destructive" : "font-semibold"}>
                {expectedBalance !== null ? formatNumber(expectedBalance) : "—"}
              </span>
            </div>
          </div>

          {overBalanceLimit && (
            <p className="text-xs text-destructive">
              Expected balance exceeds the maximum of{" "}
              {formatNumber(MAX_TOKEN_BALANCE)} tokens.
            </p>
          )}

          <FormSubmitError error={grantBonus.error} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? <LoadingSpinner size="sm" /> : "Grant bonus"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
