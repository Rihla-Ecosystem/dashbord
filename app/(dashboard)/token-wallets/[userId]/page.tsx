"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CirclePlus, Gift, Loader2 } from "lucide-react";
import Link from "next/link";
import { RoleGuard } from "@/features/auth/role-guard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { useAdminTokenWalletDetails } from "@/hooks/useAdminTokenWalletDetails";
import { WalletSummaryCards } from "@/features/token-wallets/WalletSummaryCards";
import { WalletStatusBadge } from "@/features/token-wallets/WalletStatusBadge";
import { CopyIdButton } from "@/features/token-wallets/CopyIdButton";
import { GrantBonusDialog } from "@/features/token-wallets/GrantBonusDialog";
import { AdjustTokensDialog } from "@/features/token-wallets/AdjustTokensDialog";
import { TransactionHistory } from "@/features/token-wallets/TransactionHistory";
import { formatDateTime, formatNumber } from "@/utils";

function Details() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId ?? null;
  const details = useAdminTokenWalletDetails(userId);
  const [bonusOpen, setBonusOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  if (details.error) return <ErrorState onRetry={() => details.refetch()} />;
  if (details.isLoading || !details.data) return <div className="flex min-h-[300px] items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>;
  const { user, wallet, summary } = details.data;
  return <div className="space-y-6">
    <PageHeader title="Token Wallet" description="Wallet balance, activity, and administrative controls.">
      <Button variant="outline" render={<Link href="/token-wallets" />}><ArrowLeft className="size-4" /> All wallets</Button>
      <Button onClick={() => setBonusOpen(true)}><Gift className="size-4" /> Grant Bonus</Button>
      <Button variant="secondary" onClick={() => setAdjustOpen(true)}><CirclePlus className="size-4" /> Adjust Tokens</Button>
    </PageHeader>
    <section className="grid gap-4 lg:grid-cols-2">
      <InfoCard title="User"><Info label="Name" value={user.displayName} /><Info label="Email" value={user.email} /><Info label="User ID" value={<Id value={user.id} />} /><Info label="Account" value={`${user.isActive ? "Active" : "Inactive"}${user.isBanned ? " · Banned" : ""}`} /></InfoCard>
      <InfoCard title="Wallet"><Info label="Wallet ID" value={wallet.id ? <Id value={wallet.id} /> : "Not created yet"} /><Info label="Current balance" value={`${formatNumber(wallet.tokenBalance)} tokens`} /><Info label="Status" value={<WalletStatusBadge status={wallet.status} />} /><Info label="Created" value={wallet.createdAt ? formatDateTime(wallet.createdAt) : "Not created yet"} /><Info label="Updated" value={wallet.updatedAt ? formatDateTime(wallet.updatedAt) : "Not created yet"} /></InfoCard>
    </section>
    <section className="space-y-3"><h2 className="text-lg font-semibold">Summary</h2><WalletSummaryCards summary={summary} /></section>
    <TransactionHistory userId={user.id} />
    <GrantBonusDialog key={`bonus-${user.id}-${bonusOpen}`} open={bonusOpen} onOpenChange={setBonusOpen} userId={user.id} userName={user.displayName} currentBalance={wallet.tokenBalance} walletStatus={wallet.status} />
    <AdjustTokensDialog key={`adjust-${user.id}-${adjustOpen}`} open={adjustOpen} onOpenChange={setAdjustOpen} userId={user.id} userName={user.displayName} userEmail={user.email} currentBalance={wallet.tokenBalance} walletStatus={wallet.status} />
  </div>;
}
function InfoCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-3 rounded-2xl border border-border/50 bg-card p-5"><h2 className="font-semibold">{title}</h2><dl className="grid gap-3 sm:grid-cols-2">{children}</dl></section>; }
function Info({ label, value }: { label: string; value: React.ReactNode }) { return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words text-sm font-medium">{value}</dd></div>; }
function Id({ value }: { value: string }) { return <span className="flex items-center gap-1"><span className="max-w-[220px] truncate font-mono text-xs">{value}</span><CopyIdButton value={value} /></span>; }
export default function TokenWalletDetailsPage() { return <RoleGuard roles={["ADMIN"]}><Details /></RoleGuard>; }
