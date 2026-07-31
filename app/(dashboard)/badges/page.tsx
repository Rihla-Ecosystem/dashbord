"use client";

import { Award } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { EmptyState } from "@/components/shared/EmptyState";

const SAMPLE_BADGES = [
  { id: "1", name: "Explorer", description: "Visited 10 different locations", icon: "🧭", earned: 42 },
  { id: "2", name: "Social Butterfly", description: "Connected with 50 users", icon: "🦋", earned: 28 },
  { id: "3", name: "XP Master", description: "Reached level 10", icon: "⚡", earned: 15 },
  { id: "4", name: "Verified Traveler", description: "Completed email verification", icon: "✅", earned: 120 },
  { id: "5", name: "Early Adopter", description: "Joined during beta", icon: "🚀", earned: 8 },
  { id: "6", name: "Culture Enthusiast", description: "Explored 5 cultural sites", icon: "🏛️", earned: 22 },
];

export default function BadgesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Badges" description="Achievement badges and user rewards" />

      {SAMPLE_BADGES.length === 0 ? (
        <EmptyState title="No badges configured" description="Create badges to reward user achievements" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_BADGES.map((badge) => (
            <DashboardCard key={badge.id} title="">
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-2xl">
                  {badge.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{badge.name}</h3>
                    <Award className="size-4 text-amber-500" />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{badge.description}</p>
                  <p className="mt-2 text-xs font-medium text-primary">
                    {badge.earned} users earned
                  </p>
                </div>
              </div>
            </DashboardCard>
          ))}
        </div>
      )}
    </div>
  );
}
