"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { CheckSquare, Eye, Edit3, MapPin, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { CategoryBadge, RiskBadge, StatusBadge } from "./badges";
import { formatRelative } from "@/utils";
import type { GeoLocation, GeoSort } from "@/types/geocontext";

interface LocationTableProps {
  locations: GeoLocation[];
  isLoading: boolean;
  selectedId?: string;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onSelect: (location: GeoLocation) => void;
  onEdit: (location: GeoLocation) => void;
  onDelete: (location: GeoLocation) => void;
  onRowContextMenu?: (location: GeoLocation, e: React.MouseEvent) => void;
  renderPublishToggle?: (location: GeoLocation) => React.ReactNode;
  canEdit: boolean;
  canDelete: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Maps a TanStack sorting state to the API `GeoSort` shape (server-side). */
export function toGeoSort(sorting: SortingState): GeoSort | undefined {
  const first = sorting[0];
  if (!first) return undefined;
  const field = first.id as GeoSort["field"];
  if (!["updatedAt", "nameEn", "safetyScore", "category"].includes(field)) return undefined;
  return { field, order: first.desc ? "desc" : "asc" };
}

export function LocationTable({
  locations,
  isLoading,
  selectedId,
  sorting,
  onSortingChange,
  onSelect,
  onEdit,
  onDelete,
  onRowContextMenu,
  renderPublishToggle,
  canEdit,
  canDelete,
  selectedIds,
  onSelectionChange,
  emptyTitle = "No locations found",
  emptyDescription = "Try adjusting your filters, or add a new location.",
}: LocationTableProps) {
  const selectable = !!onSelectionChange;
  const pageIds = locations.map((l) => l.id);
  const isSelected = (id: string) => (selectedIds?.has(id) ?? false);
  const allPageSelected = selectable && pageIds.length > 0 && pageIds.every((id) => isSelected(id));

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds ?? []);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allPageSelected) {
      const ids = new Set(selectedIds ?? []);
      pageIds.forEach((id) => ids.delete(id));
      onSelectionChange(ids);
    } else {
      onSelectionChange(new Set([...(selectedIds ?? []), ...pageIds]));
    }
  };

  const columns: ColumnDef<GeoLocation, unknown>[] = [
    ...(selectable
      ? ([
          {
            id: "select",
            header: () => (
              <button type="button" onClick={toggleAll} aria-label="Select all on page" className="text-muted-foreground hover:text-foreground">
                {allPageSelected ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4" />}
              </button>
            ),
            cell: ({ row }: { row: { original: GeoLocation } }) => (
              <button type="button" onClick={() => toggleOne(row.original.id)} aria-label="Select row" className="text-muted-foreground hover:text-primary">
                {isSelected(row.original.id) ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4" />}
              </button>
            ),
          },
        ] as ColumnDef<GeoLocation, unknown>[])
      : []),
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
      sortingFn: (a, b) => a.original.category.localeCompare(b.original.category),
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
      sorting={sorting}
      onSortingChange={onSortingChange}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      onRowContextMenu={onRowContextMenu}
    />
  );
}