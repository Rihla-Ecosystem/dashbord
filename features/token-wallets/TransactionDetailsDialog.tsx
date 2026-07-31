"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminTokenTransactionItem } from "@/types/admin-token-wallet";
import { formatDateTime, formatNumber } from "@/utils";
import {
  formatTransactionSourceLabel,
  formatTransactionTypeLabel,
} from "./transaction-format";
import {
  formatSignedTokenAmount,
  getTransactionDirection,
  readTransactionMetadata,
} from "./transaction-metadata";
import { TransactionTypeBadge, AdjustmentOperationBadge } from "./TransactionBadges";
import { CopyIdButton } from "./CopyIdButton";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "—";

interface FieldProps {
  label: string;
  value: React.ReactNode;
}

function Field({ label, value }: FieldProps) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm">{value}</dd>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h4>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function CopyField({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return <Field label={label} value={PLACEHOLDER} />;
  }
  return (
    <Field
      label={label}
      value={
        <span className="flex items-center gap-1">
          <span className="max-w-[200px] truncate font-mono text-xs">
            {value}
          </span>
          <CopyIdButton value={value} label={`Copy ${label.toLowerCase()}`} />
        </span>
      }
    />
  );
}

interface TransactionDetailsDialogProps {
  transaction: AdminTokenTransactionItem | null;
  onClose: () => void;
}

export function TransactionDetailsDialog({
  transaction,
  onClose,
}: TransactionDetailsDialogProps) {
  const meta = transaction ? readTransactionMetadata(transaction.metadata) : null;
  const operation = meta ? meta.operation : undefined;
  const direction = transaction
    ? getTransactionDirection(transaction.type, operation)
    : "neutral";

  return (
    <Dialog
      open={transaction !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transaction details</DialogTitle>
          <DialogDescription>
            Full record for the selected token transaction
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p
                  className={cn(
                    "text-lg font-semibold tabular-nums",
                    direction === "positive" && "text-emerald-600 dark:text-emerald-400",
                    direction === "negative" && "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {formatSignedTokenAmount(
                    transaction.tokens,
                    transaction.type,
                    operation
                  )}{" "}
                  tokens
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(transaction.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <TransactionTypeBadge type={transaction.type} />
                {transaction.type === "ADJUSTMENT" && (
                  <AdjustmentOperationBadge operation={operation} />
                )}
              </div>
            </div>

            <Section title="Movement">
              <Field
                label="Type"
                value={formatTransactionTypeLabel(transaction.type)}
              />
              <Field label="Source" value={formatTransactionSourceLabel(transaction.source)} />
              <Field label="Tokens" value={formatNumber(transaction.tokens)} />
              <Field
                label="Direction"
                value={
                  direction === "positive"
                    ? "Credited (+)"
                    : direction === "negative"
                      ? "Debited (−)"
                      : "Unknown"
                }
              />
              {transaction.type === "ADJUSTMENT" && (
                <Field
                  label="Operation"
                  value={
                    operation === "CREDIT"
                      ? "CREDIT"
                      : operation === "DEBIT"
                        ? "DEBIT"
                        : "Unknown operation"
                  }
                />
              )}
            </Section>

            <Section title="Balance context">
              <Field
                label="Previous balance"
                value={
                  meta?.previousBalance !== undefined
                    ? formatNumber(meta.previousBalance)
                    : PLACEHOLDER
                }
              />
              <Field
                label="New balance"
                value={
                  meta?.newBalance !== undefined
                    ? formatNumber(meta.newBalance)
                    : PLACEHOLDER
                }
              />
              <Field
                label="Reason"
                value={meta?.reason ?? PLACEHOLDER}
              />
            </Section>

            <Section title="References">
              <CopyField label="Transaction ID" value={transaction.id} />
              <CopyField label="Related transaction" value={meta?.relatedTransactionId ?? null} />
              <CopyField label="Payment ID" value={transaction.paymentId} />
              <CopyField label="Reference ID" value={transaction.referenceId} />
              <CopyField label="Wallet ID" value={transaction.walletId} />
            </Section>

            <Section title="Advanced">
              <Field
                label="Actor ID"
                value={meta?.actorId ? (
                  <span className="font-mono text-xs">{meta.actorId}</span>
                ) : (
                  PLACEHOLDER
                )}
              />
              <Field
                label="Idempotency key"
                value={meta?.idempotencyKey ? (
                  <span className="font-mono text-xs">{meta.idempotencyKey}</span>
                ) : (
                  PLACEHOLDER
                )}
              />
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
