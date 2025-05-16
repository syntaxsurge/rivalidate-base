'use client'

import Link from 'next/link'
import * as React from 'react'

import { Identity, Avatar, Name } from '@coinbase/onchainkit/identity'

import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/tables/data-table'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import type { TableProps, CandidateDirectoryRow } from '@/lib/types/tables'

export default function CandidatesTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: TableProps<CandidateDirectoryRow>) {
  /* ---------------------------------------------------------------------- */
  /* Centralised navigation helpers                                         */
  /* ---------------------------------------------------------------------- */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* ---------------------------------------------------------------------- */
  /* Column definitions                                                     */
  /* ---------------------------------------------------------------------- */
  const columns = React.useMemo<Column<CandidateDirectoryRow>[]>(() => {
    return [
      {
        key: 'name',
        header: sortableHeader('Name', 'name'),
        sortable: false,
        render: (_v, row) =>
          (row as any).address ? (
            <Identity address={(row as any).address as `0x${string}`}>
              <div className='flex items-center gap-2'>
                <Avatar className='h-6 w-6' />
                <Name className='font-medium' />
              </div>
            </Identity>
          ) : (
            <div className='flex items-center gap-2'>
              <UserAvatar name={row.name} email={row.email} className='size-7' />
              <span className='font-medium'>{_v || 'Unnamed'}</span>
            </div>
          ),
      },
      {
        key: 'email',
        header: sortableHeader('Email', 'email'),
        sortable: false,
        render: (v) => v as string,
        className: 'break-all',
      },
      {
        key: 'verified',
        header: sortableHeader('Verified', 'verified'),
        sortable: false,
        render: (v) => ((v as number) > 0 ? v : '—'),
      },
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => (
          <Button asChild variant='link' size='sm' className='text-primary'>
            <Link href={`/candidates/${row.id}`}>View Profile</Link>
          </Button>
        ),
      },
    ]
  }, [sortableHeader])

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='name'
      filterValue={search}
      onFilterChange={handleSearchChange}
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
  )
}
