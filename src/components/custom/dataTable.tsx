"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel, getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell, TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {Button} from "@/components/ui/button"
import {useState} from "react";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

export function DataTable<TData, TValue>({
                                             columns,
                                             data,
                                             baseLink = undefined,
                                             keyToAppendToLink = undefined,
                                             rowCount = undefined,
                                             pageCount = undefined,
                                             updatePage = undefined,
                                             loading = false
                                         }: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        rowCount: rowCount ? rowCount : undefined,
        pageCount: pageCount ? pageCount : undefined,
    })
    return (
        <div className={`rounded-md border ${loading ? 'opacity-40' : ''}`}>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => {

                            if(baseLink && keyToAppendToLink) {
                                return(
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className="cursor-pointer hover:bg-muted"
                                        onClick={() => {
                                            window.location.href = `${baseLink}/${row.original[keyToAppendToLink].id}`
                                        }}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                )
                            }


                            return(
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {
                rowCount ? (
                    <div className="flex flex-row items-center justify-center gap-2 w-full mt-2 mb-2">
                        <Button
                            onClick={() => {
                                table.firstPage()
                                if (updatePage) {
                                    updatePage("first")
                                }
                            }}
                            disabled={!table.getCanPreviousPage()}
                            variant="outline"
                        >
                            {'<<'}
                        </Button>
                        <Button
                            onClick={() => {
                                table.previousPage()
                                if( updatePage) {
                                    updatePage("backward")
                                }
                            }}
                            disabled={!table.getCanPreviousPage()}
                            variant="outline"
                        >
                            {'<'}
                        </Button>
                        <Button
                            onClick={() => {
                                table.nextPage()
                                if (updatePage) {
                                    updatePage("forward")
                                }
                            }}
                            disabled={!table.getCanNextPage()}
                            variant="outline"
                        >
                            {'>'}
                        </Button>
                        <Button
                            onClick={() => {
                                table.lastPage()
                                if (updatePage) {
                                    updatePage("last")
                                }
                            }}
                            disabled={!table.getCanNextPage()}
                            variant="outline"
                        >
                            {'>>'}
                        </Button>
                    </div>
                ) : null
            }
        </div>
    )
}
