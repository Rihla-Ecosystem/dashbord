"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile, useProfileMutations } from "@/hooks/useProfile";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500).optional().nullable(),
  nationality: z.string().optional().nullable(),
  travelStyle: z.string().optional().nullable(),
  budget: z.string().optional().nullable(),
  accommodation: z.string().optional().nullable(),
  languages: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: profile, isLoading, error, refetch } = useProfile();
  const { updateProfile, uploadAvatar, deleteAvatar } = useProfileMutations();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          name: profile.name,
          bio: profile.bio ?? "",
          nationality: profile.nationality ?? "",
          travelStyle: profile.travelStyle ?? "",
          budget: profile.budget ?? "",
          accommodation: profile.accommodation ?? "",
          languages: profile.languages?.join(", ") ?? "",
        }
      : undefined,
  });

  if (isLoading) return <PageLoader />;
  if (error || !profile) return <ErrorState onRetry={() => refetch()} />;

  const onSubmit = (data: ProfileForm) => {
    updateProfile.mutate({
      name: data.name,
      bio: data.bio || null,
      nationality: data.nationality || null,
      travelStyle: data.travelStyle || null,
      budget: data.budget || null,
      accommodation: data.accommodation || null,
      languages: data.languages
        ? data.languages.split(",").map((l) => l.trim()).filter(Boolean)
        : [],
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Profile" description="Manage your personal information" />

      <DashboardCard title="Avatar">
        <AvatarUpload
          name={profile.name}
          avatarUrl={profile.avatar}
          onUpload={(file) => uploadAvatar.mutate(file)}
          onDelete={() => deleteAvatar.mutate()}
          isUploading={uploadAvatar.isPending || deleteAvatar.isPending}
        />
      </DashboardCard>

      <DashboardCard title="Personal Information">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Name</label>
              <Input className="rounded-xl" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20"
                {...register("bio")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nationality</label>
              <Input className="rounded-xl" {...register("nationality")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Languages</label>
              <Input className="rounded-xl" placeholder="English, Arabic" {...register("languages")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Travel Style</label>
              <Input className="rounded-xl" {...register("travelStyle")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Budget</label>
              <Input className="rounded-xl" {...register("budget")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Accommodation</label>
              <Input className="rounded-xl" {...register("accommodation")} />
            </div>
          </div>
          <Button type="submit" className="rounded-xl" disabled={!isDirty || updateProfile.isPending}>
            {updateProfile.isPending ? <LoadingSpinner size="sm" /> : "Save changes"}
          </Button>
        </form>
      </DashboardCard>
    </div>
  );
}
