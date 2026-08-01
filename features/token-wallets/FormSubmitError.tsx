import { AlertCircle } from "lucide-react";
import { getErrorMessage } from "@/utils";

interface ErrorWithDetails { details: unknown }

function hasDetails(error: unknown): error is ErrorWithDetails {
  return typeof error === "object" && error !== null && "details" in error;
}

function getValidationDetails(error: unknown): string[] {
  if (
    hasDetails(error) &&
    Array.isArray(error.details)
  ) {
    return error.details
      .map((detail) => typeof detail === "object" && detail !== null && "message" in detail && typeof detail.message === "string" ? detail.message : "")
      .filter((message): message is string => message.length > 0);
  }
  return [];
}

interface FormSubmitErrorProps {
  error: unknown;
}

export function FormSubmitError({ error }: FormSubmitErrorProps) {
  if (!error) return null;

  const message = getErrorMessage(error);
  const details = getValidationDetails(error);

  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">{message}</p>
        {details.length > 0 && (
          <ul className="list-inside list-disc space-y-0.5 text-xs text-destructive/90">
            {details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
