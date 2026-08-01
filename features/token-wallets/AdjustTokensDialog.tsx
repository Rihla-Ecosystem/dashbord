"use client";

import { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAdjustTokens } from "@/hooks/useAdjustTokens";
import { FormSubmitError } from "./FormSubmitError";
import { MAX_TOKEN_BALANCE } from "@/constants";
import { formatNumber } from "@/utils";
import type { AdminAdjustmentInput } from "@/types/admin-token-wallet";
import { cn } from "@/lib/utils";

const optionalUuid = z.string().trim().pipe(
  z.union([z.literal(""), z.string().uuid("Must be a valid UUID")])
);

const adjustmentSchema = z.object({
  operation: z.enum(["CREDIT", "DEBIT"]),
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
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason must be at most 500 characters"),
  paymentId: optionalUuid.optional(),
  relatedTransactionId: optionalUuid.optional(),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

type DialogStep = "form" | "confirm";
type SubmissionIntent = { signature: string; idempotencyKey: string };
type AdjustmentSnapshot = Omit<AdminAdjustmentInput, "idempotencyKey">;
type PendingAdjustment = { input: AdminAdjustmentInput; expectedBalance: number };

interface AdjustTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail: string;
  currentBalance: number;
  walletStatus: string;
}

export function AdjustTokensDialog({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
  currentBalance,
  walletStatus,
}: AdjustTokensDialogProps) {
  const adjustTokens = useAdjustTokens();
  const [step, setStep] = useState<DialogStep>("form");
  const [submissionIntent, setSubmissionIntent] = useState<SubmissionIntent | null>(null);
  const [pendingAdjustment, setPendingAdjustment] = useState<PendingAdjustment | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    mode: "onChange",
    defaultValues: {
      operation: "CREDIT",
      tokens: "",
      reason: "",
      paymentId: "",
      relatedTransactionId: "",
    },
  });

  const [operation, tokensValue] = useWatch({
    control,
    name: ["operation", "tokens"],
  });

  const parsedTokens = /^\d+$/.test(tokensValue ?? "") ? Number(tokensValue) : null;
  const expectedBalance =
    parsedTokens !== null && Number.isFinite(parsedTokens)
      ? operation === "DEBIT"
        ? currentBalance - parsedTokens
        : currentBalance + parsedTokens
      : null;

  const walletIsActive = walletStatus === "ACTIVE";
  const isDebit = operation === "DEBIT";
  const isSubmitting = adjustTokens.isPending;

  const overBalanceLimit = expectedBalance !== null && expectedBalance > MAX_TOKEN_BALANCE;
  const insufficientBalance = isDebit && expectedBalance !== null && expectedBalance < 0;
  const canSubmit = isValid && isDirty && walletIsActive && !isSubmitting && !overBalanceLimit && !insufficientBalance;

  const resetDialogState = () => {
    reset();
    adjustTokens.reset();
    setStep("form");
    setPendingAdjustment(null);
    setSubmissionIntent(null);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetDialogState();
    onOpenChange(nextOpen);
  };

  const createSnapshot = (data: AdjustmentFormValues): AdjustmentSnapshot => {
    const paymentId = data.paymentId?.trim();
    const relatedTransactionId = data.relatedTransactionId?.trim();
    const snapshot: AdjustmentSnapshot = {
      operation: data.operation,
      tokens: Number(data.tokens),
      reason: data.reason.trim(),
    };
    if (paymentId) snapshot.paymentId = paymentId;
    if (relatedTransactionId) snapshot.relatedTransactionId = relatedTransactionId;
    return snapshot;
  };

  const createInput = (snapshot: AdjustmentSnapshot): AdminAdjustmentInput => {
    const signature = [
      snapshot.operation,
      snapshot.tokens,
      snapshot.reason,
      snapshot.paymentId ?? "",
      snapshot.relatedTransactionId ?? "",
    ].join("|");
    const intent = submissionIntent?.signature === signature
      ? submissionIntent
      : { signature, idempotencyKey: crypto.randomUUID() };
    if (intent !== submissionIntent) setSubmissionIntent(intent);
    return { ...snapshot, idempotencyKey: intent.idempotencyKey };
  };

  const submitAdjustment = (input: AdminAdjustmentInput) => {
    adjustTokens.mutate(
      { userId, input },
      {
        onSuccess: (result) => {
          if (result.idempotentReplay) {
            toast.success("Adjustment already applied (idempotent replay), no changes made");
          } else {
            toast.success(
              `${result.operation === "DEBIT" ? "Debited" : "Credited"} ${formatNumber(result.tokensAdjusted)} tokens (${formatNumber(result.previousBalance)} → ${formatNumber(result.newBalance)})`
            );
          }
          resetDialogState();
          onOpenChange(false);
        },
      }
    );
  };

  const onSubmit = (data: AdjustmentFormValues) => {
    const snapshot = createSnapshot(data);
    const input = createInput(snapshot);
    if (snapshot.operation === "DEBIT") {
      setPendingAdjustment({ input, expectedBalance: currentBalance - snapshot.tokens });
      setStep("confirm");
      return;
    }
    submitAdjustment(input);
  };

  const previewAmount = parsedTokens !== null ? parsedTokens : null;
  const previewOperator = isDebit ? "-" : "+";

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjust tokens</DialogTitle>
          <DialogDescription>
            Manually credit or debit the wallet of {userName || userId}
          </DialogDescription>
        </DialogHeader>

        {!walletIsActive && (
          <div className="rounded-xl border border-amber-600/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-500">
            This wallet is {walletStatus}. Adjustments are disabled until the
            wallet is active again.
          </div>
        )}

        {step === "form" ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Operation</label>
              <Controller
                control={control}
                name="operation"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value === "DEBIT" ? "DEBIT" : "CREDIT")
                    }
                  >
                    <SelectTrigger className="h-9 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREDIT">
                        Credit (+ add tokens)
                      </SelectItem>
                      <SelectItem value="DEBIT">Debit (− remove tokens)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tokens</label>
              <Input
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 250"
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
                placeholder="Why is this adjustment being made?"
                {...register("reason")}
              />
              {errors.reason && (
                <p className="text-xs text-destructive">{errors.reason.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment ID</label>
                <Input
                  className="rounded-xl font-mono text-xs"
                  placeholder="Optional UUID"
                  inputMode="text"
                  {...register("paymentId")}
                />
                {errors.paymentId && (
                  <p className="text-xs text-destructive">
                    {errors.paymentId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Related transaction</label>
                <Input
                  className="rounded-xl font-mono text-xs"
                  placeholder="Optional UUID"
                  inputMode="text"
                  {...register("relatedTransactionId")}
                />
                {errors.relatedTransactionId && (
                  <p className="text-xs text-destructive">
                    {errors.relatedTransactionId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current balance</span>
                <span className="font-medium">{formatNumber(currentBalance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tokens to {isDebit ? "deduct" : "credit"}</span>
                <span className={cn("font-medium", isDebit && "text-destructive")}>
                  {previewAmount !== null
                    ? `${previewOperator}${formatNumber(previewAmount)}`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                <span className="font-medium">Expected balance</span>
                <span className="font-semibold">
                  {expectedBalance !== null ? formatNumber(expectedBalance) : "—"}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Expected balance is a live preview only. The server validates the
              final balance atomically.
            </p>
            {overBalanceLimit && <p className="text-sm text-destructive">Token balance limit exceeded</p>}
            {insufficientBalance && <p className="text-sm text-destructive">Insufficient token balance for adjustment</p>}

            <FormSubmitError error={adjustTokens.error} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={isDebit ? "secondary" : "default"}
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : isDebit ? (
                  "Review debit"
                ) : (
                  "Confirm Credit"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User</span>
                <span className="font-medium">{userName || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{userEmail || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current balance</span>
                <span className="font-medium">{formatNumber(currentBalance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tokens to deduct</span>
                <span className="font-medium text-destructive">
                  {pendingAdjustment
                    ? `-${formatNumber(pendingAdjustment.input.tokens)}`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                <span className="font-medium">Expected balance</span>
                <span className="font-semibold">
                  {pendingAdjustment ? formatNumber(pendingAdjustment.expectedBalance) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                <span className="text-muted-foreground">Reason</span>
                <span className="max-w-[55%] truncate font-medium" title={pendingAdjustment?.input.reason}>
                  {pendingAdjustment?.input.reason || "—"}
                </span>
              </div>
              {pendingAdjustment?.input.paymentId && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment ID</span>
                  <span className="max-w-[55%] truncate font-mono text-xs">
                    {pendingAdjustment.input.paymentId}
                  </span>
                </div>
              )}
              {pendingAdjustment?.input.relatedTransactionId && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Related transaction</span>
                  <span className="max-w-[55%] truncate font-mono text-xs">
                    {pendingAdjustment.input.relatedTransactionId}
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              This is a sensitive operation. Tokens will be permanently removed
              from the wallet.
            </div>

            <FormSubmitError error={adjustTokens.error} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setPendingAdjustment(null); setStep("form"); }}
                disabled={isSubmitting}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => { if (pendingAdjustment) submitAdjustment(pendingAdjustment.input); }}
                disabled={!pendingAdjustment || isSubmitting}
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : "Confirm Debit"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
