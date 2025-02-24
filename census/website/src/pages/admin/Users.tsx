import { Button } from '@/components/controls/button/paper';
import { Checkbox } from '@/components/forms/inputs/CheckboxInput';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table/Table';
import { Clipboard } from '@/layouts/Clipboard';
import { usePromoteUser, useUsers } from '@/services/api/users';
import { ColumnDef, RowSelectionState, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { FC, useState } from 'react';

type User = Awaited<ReturnType<typeof useUsers>['data']>[number];

const columns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="ml-4 flex justify-center items-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="ml-4 flex justify-center items-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'username',
    header: 'Username'
  },
  {
    accessorKey: 'role',
    header: 'Role'
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => <span>{format(row.original.createdAt, 'MM/dd/yyyy')}</span>
  },
  {
    accessorKey: 'banned',
    header: 'Banned'
  },
  {
    accessorKey: 'restricted',
    header: 'Restricted'
  }
];

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/forms/base/dropdown-menu';
import SiChevronDown from '@/components/icons/SiChevronDown';
import SiLock from '@/components/icons/SiLock';
import { Confirm, useConfirm } from '@/components/modal/Confirm';
import { format } from 'date-fns';

export const Users: FC = () => {
  const users = useUsers();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data: users.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection }
  });

  const model = table.getRowModel();
  const selected = table.getFilteredSelectedRowModel();

  const confirm = useConfirm();
  const promoteUser = usePromoteUser();

  return (
    <Clipboard className="md:py-20">
      <Confirm {...confirm} />
      <div className="px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-accent-900">Users</h1>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
              <TableHead>Actions</TableHead>
            </tr>
          ))}
        </TableHeader>
        <TableBody>
          {model.rows?.length ? (
            model.rows.map(row => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button compact>
                        Actions <SiChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <DropdownMenuItem>
                            <SiLock />
                            <span>Change role to</span>
                            <SiChevronDown />
                          </DropdownMenuItem>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Member</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              confirm.open({
                                title: 'Change role to expert?',
                                description: `This will give ${row.original.username} expert permissions.`,
                                onConfirm: async () => {
                                  await promoteUser.mutateAsync({
                                    userId: row.original.id,
                                    role: 'expert'
                                  });
                                }
                              });
                            }}
                          >
                            Expert
                          </DropdownMenuItem>
                          <DropdownMenuItem>Moderator</DropdownMenuItem>
                          <DropdownMenuItem>Researcher</DropdownMenuItem>
                          <DropdownMenuItem>Admin</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex-1 text-sm text-accent-800 text-opacity-75 px-6 py-4">
        {selected.rows.length} of {table.getFilteredRowModel().rows.length} row
        {table.getFilteredRowModel().rows.length === 1 ? '' : 's'} selected.
      </div>
    </Clipboard>
  );
};
