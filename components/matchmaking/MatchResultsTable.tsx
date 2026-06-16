"use client";
import { DataTable, Column } from '@/components/ui/data-table';
import { Property } from '@/src/lib/matchmaking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const columns: Column<Property & { match_score: number }>[] = [
  { key: 'title', header: 'Title' },
  { key: 'location', header: 'Location' },
  { key: 'price', header: 'Price' },
  { key: 'property_type', header: 'Type' },
  {
    key: 'match_score',
    header: 'Match Score',
    render: (value, row) => {
      const score = row.match_score;
      return <Badge className={score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}>{score}</Badge>;
    }
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (value, row) => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => console.log('share', row.id)}>Share</Button>
        <Button size="sm" onClick={() => console.log('view', row.id)} variant="outline">View</Button>
      </div>
    )
  }
];

export function MatchResultsTable({ data }: { data: any[] }) {
  return <DataTable columns={columns} data={data} />;
}
