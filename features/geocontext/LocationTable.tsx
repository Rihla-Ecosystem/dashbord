"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit3, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { CategoryBadge, RiskBadge, StatusBadge } from "./badges";
import { formatRelative } from "@/utils";
import type { GeoLocation } from "@/types/geocontext";

interface LocationTableProps {
  locations: GeoLocation[];
  isLoading: boolean;
  selectedId?: string;
  onSelect: (location: GeoLocation) => void;
  onEdit: (location: GeoLocation) => void;
  onDelete: (location: GeoLocation) => void;
  renderPublishToggle?: (location: GeoLocation) => React.ReactNode;
  canEdit: boolean;
  canDelete: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function LocationTable({
  locations,
  isLoading,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  renderPublishToggle,
  canEdit,
  canDelete,
  emptyTitle = "No locations found",
  emptyDescription = "Try adjusting your filters, or add a new location.",
}: LocationTableProps) {
  const columns: ColumnDef<GeoLocation, unknown>[] = [
    {
      accessorKey: "nameEn",
      header: "Name",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onSelect(row.original)}
          className={row.original.id === selectedId ? "text-left text-sm font-semibold text-primary" : "text-left text-sm font-medium hover:text-primary"}
        >
          {row.original.nameEn}
        </button>
      ),
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <CategoryBadge category={row.original.category} />,
    },
    {
      accessorKey: "governorate",
      header: "Governorate",
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5" />
          {row.original.governorate}, {row.original.city}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "riskLevel",
      header: "Risk",
      cell: ({ row }) => <RiskBadge level={row.original.riskLevel} />,
    },
    {
      accessorKey: "safetyScore",
      header: "Safety",
      cell: ({ row }) => <span className="text-sm font-semibold">{row.original.safetyScore}</span>,
      sortingFn: (a, b) => a.original.safetyScore - b.original.safetyScore,
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatRelative(row.original.updatedAt)}</span>,
      sortingFn: "datetime",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => onSelect(row.original)} title="View on map">
            <Eye className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(row.original)} disabled={!canEdit} title="Edit">
            <Edit3 className="size-4" />
          </Button>
          {renderPublishToggle && renderPublishToggle(row.original)}
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(row.original)} disabled={!canDelete} title="Delete">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={locations}
      isLoading={isLoading}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    />
  );
}
