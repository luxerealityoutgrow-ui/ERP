"use client";
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Property } from '@/src/lib/matchmaking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const columns: ColumnDef<Property>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'location', header: 'Location' },
  { accessorKey: 'price', header: 'Price' },
  { accessorKey: 'property_type', header: 'Type' },
  {
    id: 'match_score',
    header: 'Match Score',
    cell: ({ row }) => {
      const score = row.original.match_score;
      return <Badge className={score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}>{score}</Badge>;
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => console.log('share', row.original.id)}>Share</Button>
        <Button size="sm" onClick={() => console.log('view', row.original.id)} variant="outline">View</Button>
      </div>
    )
  }
];

export function MatchResultsTable({ data }: { data: any[] }) {
  return <DataTable columns={columns} data={data} />;
}
