"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { useTokenPackage } from "@/hooks/useTokenPackages";
import { formatDateTime, formatNumber } from "@/utils";
import { TokenPackageStatusBadge } from "./TokenPackageStatusBadge";

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

interface TokenPackageDetailsDialogProps {
  packageId: number | null;
  onClose: () => void;
}

export function TokenPackageDetailsDialog({
  packageId,
  onClose,
}: TokenPackageDetailsDialogProps) {
  const { data, isLoading, error, refetch } = useTokenPackage(packageId);

  return (
    <Dialog
      open={packageId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Token package details</DialogTitle>
          <DialogDescription>
            Full record for the selected token package
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex min-h-[240px] items-center justify-center">
            <LoadingSpinner label="Loading token package..." />
          </div>
        )}

        {error && !isLoading && (
          <div className="flex min-h-[240px] items-center justify-center py-2">
            <ErrorState
              title="Couldn't load token package"
              message="We couldn't load this token package's details."
              onRetry={() => refetch()}
            />
          </div>
        )}

        {data && !isLoading && (
          <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-lg font-semibold">{data.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {data.code}
                </p>
              </div>
              <TokenPackageStatusBadge isActive={data.isActive} />
            </div>

            <Section title="Pricing">
              <Field
                label="Price"
                value={`${data.price} ${data.currency}`}
              />
              <Field label="Tokens" value={formatNumber(data.tokens)} />
              <Field label="Sort order" value={formatNumber(data.sortOrder)} />
            </Section>

            <Section title="Details">
              <Field label="Description" value={data.description ?? PLACEHOLDER} />
              <Field
                label="Related payments"
                value={formatNumber(data.paymentCount)}
              />
            </Section>

            <Section title="Timestamps">
              <Field label="Created at" value={formatDateTime(data.createdAt)} />
              <Field label="Updated at" value={formatDateTime(data.updatedAt)} />
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
