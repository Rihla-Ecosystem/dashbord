"use client";

import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { usePayment } from "@/hooks/usePayments";
import { formatDateTime, formatNumber } from "@/utils";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

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

interface PaymentDetailsDialogProps {
  paymentId: string | null;
  onClose: () => void;
}

export function PaymentDetailsDialog({ paymentId, onClose }: PaymentDetailsDialogProps) {
  const { data, isLoading, error, refetch } = usePayment(paymentId);

  return (
    <Dialog
      open={!!paymentId}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment details</DialogTitle>
          <DialogDescription>
            Full record for the selected payment
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex min-h-[240px] items-center justify-center">
            <LoadingSpinner label="Loading payment..." />
          </div>
        )}

        {error && !isLoading && (
          <div className="flex min-h-[240px] items-center justify-center py-2">
            <ErrorState
              title="Couldn't load payment"
              message="We couldn't load this payment's details."
              onRetry={() => refetch()}
            />
          </div>
        )}

        {data && !isLoading && (
          <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
            {data.status === "FAILED" && data.failureReason && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>
                  <span className="font-semibold">Payment failed:</span>{" "}
                  {data.failureReason}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-lg font-semibold">
                  {data.amount} {data.currency}
                </p>
                <p className="font-mono text-xs text-muted-foreground">{data.id}</p>
              </div>
              <PaymentStatusBadge status={data.status} />
            </div>

            <Section title="User">
              <Field label="Name" value={data.user.displayName ?? PLACEHOLDER} />
              <Field label="Email" value={data.user.email} />
              <Field
                label="User ID"
                value={
                  <span className="font-mono text-xs">{data.userId}</span>
                }
              />
            </Section>

            <Section title="Package">
              <Field label="Package at purchase" value={data.packageNameSnapshot} />
              <Field
                label="Current package"
                value={`${data.tokenPackage.name} (${data.tokenPackage.code})`}
              />
              <Field label="Tokens" value={formatNumber(data.tokensSnapshot)} />
              <Field
                label="Price"
                value={`${data.priceSnapshot} ${data.currencySnapshot}`}
              />
            </Section>

            <Section title="Payment">
              <Field label="Provider" value={data.provider} />
              <Field
                label="Provider intention ID"
                value={
                  <span className="font-mono text-xs">
                    {data.providerIntentionId ?? PLACEHOLDER}
                  </span>
                }
              />
              <Field
                label="Provider order ID"
                value={
                  <span className="font-mono text-xs">
                    {data.providerOrderId ?? PLACEHOLDER}
                  </span>
                }
              />
              <Field
                label="Provider transaction ID"
                value={
                  <span className="font-mono text-xs">
                    {data.providerTransactionId ?? PLACEHOLDER}
                  </span>
                }
              />
              <Field
                label="Paid at"
                value={data.paidAt ? formatDateTime(data.paidAt) : PLACEHOLDER}
              />
              <Field label="Created at" value={formatDateTime(data.createdAt)} />
              <Field label="Updated at" value={formatDateTime(data.updatedAt)} />
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
