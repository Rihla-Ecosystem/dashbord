"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./LoadingSpinner";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowContextMenu?: (row: TData, e: React.MouseEvent<HTMLTableRowElement>) => void;
  getRowClassName?: (row: TData) => string | undefined;
  className?: string;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  sorting,
  onSortingChange,
  emptyTitle,
  emptyDescription,
  onRowContextMenu,
  getRowClassName,
  className,
}: DataTableProps<TData>) {
  // TanStack Table's `useReactTable()` returns functions that cannot be memoized
  // safely by React Compiler (a known library limitation), so the compiler rule is
  // disabled for this call. The table is fully controlled by its props.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: onSortingChange
      ? (updater) => {
          const next = typeof updater === "function" ? updater(sorting ?? []) : updater;
          onSortingChange(next);
        }
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: !!onSortingChange,
  });

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-2xl border border-border/50 p-4" aria-hidden>
        <div className="flex gap-4 border-b border-border/50 pb-3">
          {Array.from({ length: Math.min(columns.length, 5) }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, r) => (
          <div key={r} className="flex gap-4 py-1.5">
            {Array.from({ length: Math.min(columns.length, 5) }).map((_, i) => (
              <Skeleton key={i} className="h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border/50", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex items-center gap-1 font-semibold"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ArrowUp className="size-3.5" />,
                          desc: <ArrowDown className="size-3.5" />,
                        }[header.column.getIsSorted() as string] ?? (
                          <ArrowUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn("transition-colors hover:bg-muted/20", getRowClassName?.(row.original))}
                onContextMenu={onRowContextMenu ? (e) => onRowContextMenu(row.original, e) : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
