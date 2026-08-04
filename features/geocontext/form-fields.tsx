"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function Field({
  label,
  error,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  error,
  required,
  hint,
  value,
  onChange,
  rows = 3,
  placeholder,
  disabled,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Field label={label} error={error} required={required} hint={hint}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        className="flex min-h-[70px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-3 focus:ring-primary/10 disabled:opacity-50"
      />
    </Field>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export function SelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  error,
  required,
  className,
  disabled,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Field label={label} error={error} required={required} className={className}>
      <Select value={value || undefined} onValueChange={(v) => onValueChange(v ?? "")} disabled={disabled}>
        <SelectTrigger className="h-9 w-full rounded-xl">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function TextInput({
  label,
  error,
  required,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
  disabled,
  className,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Field label={label} error={error} required={required} hint={hint} className={className}>
      <Input
        className="h-9 w-full rounded-xl"
        value={value}
        type={type}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
