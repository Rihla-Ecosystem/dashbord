"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useValidateRateCardDraft } from "@/hooks/useRateCards";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CheckCircle2, FileCheck, XCircle } from "lucide-react";
import type { RateCardValidationResult } from "@/types/ai-billing";

interface ValidateRateCardDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: string;
}

export function ValidateRateCardDraftDialog({
  open,
  onOpenChange,
  version,
}: ValidateRateCardDraftDialogProps) {
  const validateMutation = useValidateRateCardDraft();
  const [result, setResult] = useState<RateCardValidationResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<Record<string, unknown> | null>(null);

  const handleRunValidation = () => {
    setResult(null);
    setErrorText(null);
    setErrorDetails(null);

    validateMutation.mutate(version, {
      onSuccess: (data) => {
        setResult(data);
      },
      onError: (err: unknown) => {
        const e = err as {
          response?: { data?: { message?: string; code?: string; details?: unknown; mapperCode?: string } };
          message?: string;
        };
        const backendMessage = e.response?.data?.message || e.message || "Draft validation failed";
        setErrorText(backendMessage);

        if (e.response?.data) {
          setErrorDetails(e.response.data as Record<string, unknown>);
        }
      },
    });
  };

  const handleClose = () => {
    setResult(null);
    setErrorText(null);
    setErrorDetails(null);
    onOpenChange(false);
  };

  const isValid = result?.valid === true;
  const isInvalidResult = result !== null && result.valid === false;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Validate Rate Card Draft ({version})</DialogTitle>
          <DialogDescription>
            Validates the draft snapshot against pure engine mapping rules. Validation does NOT automatically publish the rate card.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {!result && !errorText && !validateMutation.isPending && (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Click below to validate all pricing entries in draft version <strong>{version}</strong> against pure engine mapping rules.
              </p>
              <Button type="button" onClick={handleRunValidation}>
                <FileCheck className="h-4 w-4 mr-2" />
                Run Engine Validation
              </Button>
            </div>
          )}

          {validateMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-6 space-y-2">
              <LoadingSpinner size="lg" />
              <p className="text-xs text-muted-foreground">Running pure engine validation...</p>
            </div>
          )}

          {(errorText || isInvalidResult) && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 space-y-2">
              <div className="flex items-center space-x-2 text-destructive font-semibold text-sm">
                <XCircle className="h-5 w-5" />
                <span>Draft Validation Failed (Invalid Rate Card)</span>
              </div>
              <p className="text-xs text-destructive/90">{errorText || "The draft snapshot contains invalid rate card entries."}</p>
              
              {Boolean(errorDetails) && (
                <div className="text-[11px] font-mono bg-background/50 p-2.5 rounded-lg border border-destructive/10 overflow-x-auto space-y-1 text-foreground">
                  {Boolean(errorDetails?.code) && (
                    <div><span className="font-semibold">Error Code:</span> {String(errorDetails?.code)}</div>
                  )}
                  {Boolean(errorDetails?.mapperCode) && (
                    <div><span className="font-semibold">Mapper Code:</span> {String(errorDetails?.mapperCode)}</div>
                  )}
                  {Boolean(errorDetails?.details) && (
                    <div>
                      <span className="font-semibold">Details:</span> {JSON.stringify(errorDetails?.details, null, 2)}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={handleRunValidation}>
                  Re-run Validation
                </Button>
              </div>
            </div>
          )}

          {isValid && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>Draft is Valid and Publishable</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <span className="font-semibold text-foreground">Total Entries:</span> {result.entryCount ?? 0}
                </div>
                {result.providers && result.providers.length > 0 && (
                  <div>
                    <span className="font-semibold text-foreground">Providers:</span> {result.providers.join(", ")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
