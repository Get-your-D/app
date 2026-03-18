'use client';

import { JSX, useMemo, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  type ColumnFiltersState,
  useReactTable,
} from '@tanstack/react-table';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import type { PatientRow } from '../../app/patients/page';

const statusOptions = ['Active', 'Inactive', 'Overdue', 'PendingFirstTest'] as const;

const bulkStatusSchema = z.object({
  status: z.enum(statusOptions),
});

interface PatientsTableProps {
  data: PatientRow[];
}

export function PatientsTable({ data }: PatientsTableProps): JSX.Element {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const columns = useMemo<ColumnDef<PatientRow>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => {
          const allSelected =
            table.getRowModel().rows.length > 0 &&
            table.getRowModel().rows.every((row) => selectedIds.has(row.original.id));

          return (
            <input
              type="checkbox"
              aria-label="Select all rows on page"
              checked={allSelected}
              onChange={(e) => {
                const next = new Set(selectedIds);
                if (e.target.checked) {
                  table.getRowModel().rows.forEach((row) => next.add(row.original.id));
                } else {
                  table.getRowModel().rows.forEach((row) => next.delete(row.original.id));
                }
                setSelectedIds(next);
              }}
              className="size-4 shrink-0 appearance-none rounded border-2 border-orange-200 bg-white checked:border-orange-500 checked:bg-orange-500"
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.name}`}
            checked={selectedIds.has(row.original.id)}
            onChange={(e) => {
              const next = new Set(selectedIds);
              if (e.target.checked) {
                next.add(row.original.id);
              } else {
                next.delete(row.original.id);
              }
              setSelectedIds(next);
            }}
            className="size-4 shrink-0 appearance-none rounded border-2 border-orange-200 bg-white checked:border-orange-500 checked:bg-orange-500"
          />
        ),
      },
      {
        accessorKey: 'name',
        header: () => 'Name',
        cell: ({ row }) => (
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            // TODO: Wire to patient profile route when available.
            onClick={() => {
              // placeholder for row click behavior
              // e.g. router.push(`/patients/${row.original.id}`)
            }}
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: 'lastTestDate',
        header: () => 'Last Test Date',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.lastTestDate ?? 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'compliancePercent',
        header: () => 'Compliance %',
        cell: ({ row }) => {
          const value = row.original.compliancePercent;
          if (value === null || value === undefined) {
            return <span className="text-sm text-muted-foreground">N/A</span>;
          }

          let colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
          if (value >= 80) {
            colorClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
          } else if (value >= 50) {
            colorClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
          }

          return (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
              {value}%
            </span>
          );
        },
      },
      {
        accessorKey: 'retestDueDate',
        header: () => 'Re-test Due Date',
        cell: ({ row }) => {
          const { retestDueDate, retestRelativeLabel } = row.original;
          if (!retestDueDate) {
            return <span className="text-sm text-muted-foreground">N/A</span>;
          }

          const isOverdue = retestRelativeLabel?.toLowerCase().includes('overdue');
          const badgeClass = isOverdue
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
            : 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200';

          return (
            <div className="flex flex-col">
              <span className="text-sm">{retestDueDate}</span>
              <span className={`mt-1 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>
                {retestRelativeLabel}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: () => 'Status',
        // Use exact matching for the dropdown filter.
        // TanStack Table defaults to substring matching (e.g. "Active" matches "Inactive"),
        // but users expect strict equality here.
        filterFn: (row, columnId, filterValue) => {
          const rowValue = row.getValue<string>(columnId);
          return String(rowValue) === String(filterValue);
        },
        cell: ({ row }) => {
          const value = row.original.status;
          const color =
            value === 'Active'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
              : value === 'Overdue'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                : value === 'PendingFirstTest'
                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200'
                  : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-100';

          return (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
              {value}
            </span>
          );
        },
      },
    ],
    [selectedIds],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const term = String(filterValue).toLowerCase();
      const name = String(row.getValue<string>('name') ?? '').toLowerCase();
      const email = String(row.original.email ?? '').toLowerCase();
      return name.includes(term) || email.includes(term);
    },
  });

  const filteredRows = table.getFilteredRowModel().rows;

  const bulkStatusForm = useForm({
    defaultValues: {
      status: 'Active' as (typeof statusOptions)[number],
    },
    onSubmit: ({ value }) => {
      const parsed = bulkStatusSchema.safeParse(value);
      if (!parsed.success) {
        // In a real app, surface validation errors to the user.
        return;
      }

      // TODO: Call backend to update status for selectedIds.
      // This is a placeholder to show the TanStack Form + Zod setup.
      console.log('Bulk update status', parsed.data.status, Array.from(selectedIds));
    },
  });

  const handleExportCsv = (): void => {
    const rows = filteredRows.map((row) => row.original);
    const header = ['Name', 'Email', 'Last Test Date', 'Compliance %', 'Re-test Due Date', 'Status'];
    const csvLines = [
      header.join(','),
      ...rows.map((r) =>
        [
          `"${r.name}"`,
          `"${r.email}"`,
          r.lastTestDate ?? '',
          r.compliancePercent ?? '',
          r.retestDueDate ?? '',
          r.status,
        ].join(','),
      ),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'patients.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = (): void => {
    // Simple browser-friendly export: open printable view, let user "Save as PDF".
    const rows = filteredRows.map((row) => row.original);
    const html = `
      <html>
        <head>
          <title>Patients</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #e5e5e5; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>Patients</h1>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Last Test Date</th>
                <th>Compliance %</th>
                <th>Re-test Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (r) => `
                <tr>
                  <td>${r.name}</td>
                  <td>${r.email}</td>
                  <td>${r.lastTestDate ?? ''}</td>
                  <td>${r.compliancePercent ?? ''}</td>
                  <td>${r.retestDueDate ?? ''}</td>
                  <td>${r.status}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            className="input input-bordered input-sm w-full bg-base-100 text-base-content border-base-300 sm:max-w-xs"
            placeholder="Search by name or email"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />

          <select
            className="select select-bordered select-sm w-full bg-base-100 text-base-content border-base-300 sm:w-48"
            value={statusFilter ?? ''}
            onChange={(e) => {
              const value = e.target.value || null;
              setStatusFilter(value);

              if (!value) {
                setColumnFilters((prev) => prev.filter((f) => f.id !== 'status'));
              } else {
                setColumnFilters((prev) => {
                  const others = prev.filter((f) => f.id !== 'status');
                  return [...others, { id: 'status', value }];
                });
              }
            }}
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleExportCsv}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleExportPdf}
          >
            Export PDF
          </button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="alert alert-warning flex flex-col gap-3 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium">
            {selectedCount} patient{selectedCount === 1 ? '' : 's'} selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-warning btn-xs"
              // TODO: Wire to reminder API.
              onClick={() => {
                console.log('Send re-test reminders to', Array.from(selectedIds));
              }}
            >
              Send re-test reminders
            </button>

            <bulkStatusForm.Field
              name="status"
              children={(field) => (
                <select
                  className="select select-bordered select-xs bg-base-100 text-base-content border-base-300"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as (typeof statusOptions)[number])}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      Set status: {option}
                    </option>
                  ))}
                </select>
              )}
            />

            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => {
                void bulkStatusForm.handleSubmit();
              }}
            >
              Update status
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table table-zebra text-sm">
          <thead className="bg-base-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-base-content/80"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: '▲',
                          desc: '▼',
                        }[header.column.getIsSorted() as string] ?? null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-base-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-center text-sm text-base-content/60" colSpan={columns.length}>
                  No patients found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-base-200">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 text-xs text-base-content/80 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            className="select select-bordered select-xs w-24 bg-base-100 text-base-content border-base-300"
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[10, 25, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount() || 1}
          </span>
          <div className="flex items-center gap-1 text-base-content">
            <button
              type="button"
              className="btn btn-outline btn-xs disabled:btn-disabled"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-outline btn-xs disabled:btn-disabled"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

