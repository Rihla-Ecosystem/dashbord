import type {
  AdjustmentOperation,
  TokenTransactionMetadata,
  TokenTransactionType,
} from "@/types/admin-token-wallet";

export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  value: unknown
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function readAdjustmentOperation(
  value: unknown
): AdjustmentOperation | undefined {
  return value === "CREDIT" || value === "DEBIT" ? value : undefined;
}

export function readTokenTransactionType(
  value: unknown
): TokenTransactionType | undefined {
  return value === "GRANT" ||
    value === "CONSUME" ||
    value === "REFUND" ||
    value === "BONUS" ||
    value === "ADJUSTMENT"
    ? value
    : undefined;
}

export function readTransactionMetadata(
  raw: unknown
): TokenTransactionMetadata {
  const meta = isJsonObject(raw) ? raw : {};

  return {
    operation: readAdjustmentOperation(meta.operation),
    reason: readString(meta.reason),
    actorId: readString(meta.actorId),
    previousBalance: readNumber(meta.previousBalance),
    newBalance: readNumber(meta.newBalance),
    idempotencyKey: readString(meta.idempotencyKey),
    relatedTransactionId: readString(meta.relatedTransactionId),
  };
}

export type TransactionDirection = "positive" | "negative" | "neutral";

export function getTransactionDirection(
  type: string,
  operation: AdjustmentOperation | undefined
): TransactionDirection {
  switch (type) {
    case "GRANT":
    case "BONUS":
    case "REFUND":
      return "positive";
    case "CONSUME":
      return "negative";
    case "ADJUSTMENT":
      return operation === "CREDIT" ? "positive" : operation === "DEBIT" ? "negative" : "neutral";
    default:
      return "neutral";
  }
}

export function formatSignedTokenAmount(
  tokens: number,
  type: string,
  operation: AdjustmentOperation | undefined
): string {
  const direction = getTransactionDirection(type, operation);
  const formatted = new Intl.NumberFormat("en-US").format(tokens);

  if (direction === "positive") return `+${formatted}`;
  if (direction === "negative") return `-${formatted}`;
  return formatted;
}
