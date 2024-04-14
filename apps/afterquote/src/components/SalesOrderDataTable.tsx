import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { DataTableViewOptions } from "./DataTableViewOptions";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function SalesOrderDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = useState({
    pageIndex: 0, //initial page index
    pageSize: 20, //default page size
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const router = useRouter();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onPaginationChange: setPagination,
  });

  const [searchValue, setSearchValue] = useState(router.query.q || "");
  const [filteredRows, setFilteredRows] = useState(table.getRowModel().rows);

  function filterRows(value: string) {
    if (value === "") {
      setFilteredRows(table.getRowModel().rows);
      return;
    } else {
      const newFilteredRows = table.getRowModel().rows.filter((row) => {
        if (
          (row.original as { customerId: string }).customerId
            ?.toLowerCase()
            .includes(value.toLowerCase()) ||
          (row.original as { invoiceNumber: string }).invoiceNumber
            ?.toLowerCase()
            .startsWith(value.toLowerCase()) ||
          (row.original as { poNumber: string }).poNumber
            ?.toLowerCase()
            .startsWith(value.toLowerCase()) ||
          (row.original as { piNumber: string }).piNumber
            ?.toLowerCase()
            .startsWith(value.toLowerCase())
        ) {
          return true;
        }
        return false;
      });
      setFilteredRows(newFilteredRows);
    }
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    const query = router.query;
    query.q = value;
    void router.push(
      {
        pathname: router.pathname,
        query: query,
      },
      undefined,
      { shallow: true }
    );

    filterRows(value);
  };

  useEffect(() => {
    console.log(router.query.q);
    setSearchValue(router.query.q || "");
    filterRows(
      Array.isArray(router.query.q)
        ? router.query.q[0] || ""
        : router.query.q || ""
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center">
        <Input
          placeholder="Search orders"
          value={searchValue}
          onChange={handleSearch}
          className="bg-background sm:w-[150px] lg:w-[250px]"
        />
        <DataTableViewOptions table={table} />
      </div>
      <div className="mt-4 rounded-md bg-background shadow-sm sm:border">
        <div className="relative">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary">
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
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {searchValue.length == 0 && table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : searchValue.length > 0 && filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
