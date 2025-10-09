"use client"

import React from "react"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string
  header: React.ReactNode
  className?: string
  cell?: (item: T, index: number) => React.ReactNode
  sortable?: boolean
  sortAccessor?: (item: T) => any
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  getRowKey: (item: T, index: number) => React.Key
  emptyText?: string
  striped?: boolean
  className?: string
  pageSize?: number // enable simple client-side pagination if provided
  loading?: boolean
}

export function DataTable<T>({ columns, data, getRowKey, emptyText = "No records found.", striped = false, className, pageSize, loading = false }: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc")
  const [page, setPage] = React.useState(1)

  const sorted = React.useMemo(() => {
    if (!sortKey) return data
    const col = columns.find(c => c.key === sortKey)
    if (!col || !col.sortable) return data
    const accessor = col.sortAccessor ?? ((item: any) => item[sortKey])
    const arr = [...data]
    arr.sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      if (av == null && bv == null) return 0
      if (av == null) return -1
      if (bv == null) return 1
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [data, sortKey, sortDir, columns])

  const totalPages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1
  const paged = pageSize ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted

  const toggleSort = (key: string, col: Column<T>) => {
    if (!col.sortable) return
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {columns.map(col => (
              <TableHead key={col.key} className={cn("font-semibold", col.className)}>
                {col.sortable ? (
                  <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort(col.key, col)}>
                    <span>{col.header}</span>
                    {sortKey === col.key ? (
                      <span className="text-xs text-muted-foreground">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">⇵</span>
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!loading && (paged.length === 0) && (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                {emptyText}
              </TableCell>
            </TableRow>
          )}
          {!loading && paged.map((item, idx) => (
            <TableRow key={getRowKey(item, (page - 1) * (pageSize ?? 0) + idx)} className={cn("transition-colors", striped && idx % 2 === 1 ? "bg-muted/30" : undefined)}>
              {columns.map(col => (
                <TableCell key={col.key} className={col.className}>
                  {col.cell ? col.cell(item, (page - 1) * (pageSize ?? 0) + idx) : (item as any)[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pageSize && totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="text-muted-foreground">Page {page} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <button type="button" className="h-8 px-3 rounded-md border" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            <button type="button" className="h-8 px-3 rounded-md border" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
