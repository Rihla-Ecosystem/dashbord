"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  useCreateTokenPackage,
  useUpdateTokenPackage,
} from "@/hooks/useTokenPackages";
import type {
  AdminTokenPackage,
  CreateAdminTokenPackageInput,
  UpdateAdminTokenPackageInput,
} from "@/types/token-packages";
import { getErrorMessage } from "@/utils";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  code: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine(
      (value) => /^[A-Z0-9_]+$/.test(value),
      "Code may contain only letters, digits, and underscores"
    ),
  price: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Price must be a positive number with at most 2 decimals"
    )
    .refine((value) => Number(value) > 0, "Price must be greater than zero"),
  currency: z.literal("EGP"),
  tokens: z
    .string()
    .min(1, "Tokens is required")
    .regex(/^\d+$/, "Tokens must be a whole number")
    .refine((value) => Number(value) > 0, "Tokens must be greater than zero"),
  sortOrder: z
    .string()
    .min(1, "Sort order is required")
    .regex(/^\d+$/, "Sort order must be a whole number"),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface TokenPackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg: AdminTokenPackage | null;
}

export function TokenPackageFormDialog({
  open,
  onOpenChange,
  pkg,
}: TokenPackageFormDialogProps) {
  const isEditMode = !!pkg;

  const createPackage = useCreateTokenPackage();
  const updatePackage = useUpdateTokenPackage();
  const isSubmitting = createPackage.isPending || updatePackage.isPending;
  const submitError = createPackage.error ?? updatePackage.error;

  const defaultValues: FormValues = pkg
    ? {
        name: pkg.name,
        description: pkg.description ?? "",
        code: pkg.code,
        price: pkg.price,
        currency: "EGP",
        tokens: String(pkg.tokens),
        sortOrder: String(pkg.sortOrder),
        isActive: pkg.isActive,
      }
    : {
        name: "",
        description: "",
        code: "",
        price: "",
        currency: "EGP",
        tokens: "",
        sortOrder: "",
        isActive: true,
      };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const codeField = register("code");

  const onSubmit = (data: FormValues) => {
    if (isEditMode && pkg) {
      const patch: UpdateAdminTokenPackageInput = {};
      if (data.name !== pkg.name) patch.name = data.name;
      const description = data.description?.trim() ? data.description.trim() : null;
      if (description !== pkg.description) patch.description = description;
      if (data.price !== pkg.price) patch.price = data.price;
      if (data.currency !== pkg.currency) patch.currency = data.currency;
      const tokens = Number(data.tokens);
      if (tokens !== pkg.tokens) patch.tokens = tokens;
      const sortOrder = Number(data.sortOrder);
      if (sortOrder !== pkg.sortOrder) patch.sortOrder = sortOrder;
      if (Object.keys(patch).length === 0) {
        onOpenChange(false);
        return;
      }
      updatePackage.mutate(
        { id: pkg.id, input: patch },
        { onSuccess: () => onOpenChange(false) }
      );
      return;
    }

    const input: CreateAdminTokenPackageInput = {
      name: data.name,
      description: data.description?.trim() || undefined,
      code: data.code,
      price: data.price,
      currency: "EGP",
      tokens: Number(data.tokens),
      sortOrder: Number(data.sortOrder),
      isActive: data.isActive,
    };
    createPackage.mutate(input, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit token package" : "Create token package"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of this token package. The code cannot be changed."
              : "Add a new token package. The code is permanent and cannot be changed later."}
          </DialogDescription>
        </DialogHeader>

        <form
          key={pkg?.id ?? "new"}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              className="rounded-xl"
              placeholder="e.g. Starter Pack"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Code</label>
            <Input
              className="rounded-xl"
              placeholder="e.g. STARTER_01"
              disabled={isEditMode}
              {...codeField}
              onChange={(event) => {
                event.target.value = event.target.value.toUpperCase();
                codeField.onChange(event);
              }}
            />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Uppercase letters, digits, and underscores. Cannot be changed
              after creation.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20"
              placeholder="Optional"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Price</label>
              <Input
                className="rounded-xl"
                placeholder="e.g. 49.99"
                inputMode="decimal"
                {...register("price")}
              />
              {errors.price && (
                <p className="text-xs text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Input className="rounded-xl" value="EGP" disabled />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tokens</label>
              <Input
                className="rounded-xl"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 500"
                {...register("tokens")}
              />
              {errors.tokens && (
                <p className="text-xs text-destructive">
                  {errors.tokens.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort order</label>
              <Input
                className="rounded-xl"
                type="number"
                min={0}
                step={1}
                placeholder="e.g. 10"
                {...register("sortOrder")}
              />
              {errors.sortOrder && (
                <p className="text-xs text-destructive">
                  {errors.sortOrder.message}
                </p>
              )}
            </div>
          </div>

          {!isEditMode && (
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Make this package available on the public listing immediately.
                </p>
              </div>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          )}

          {submitError && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{getErrorMessage(submitError)}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : isEditMode ? (
                "Save changes"
              ) : (
                "Create package"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
