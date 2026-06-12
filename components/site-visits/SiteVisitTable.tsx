import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { SiteVisit } from '@/lib/siteVisits';

const columns: ColumnDef<SiteVisit>[] = [
  { accessorKey: 'visit_date', header: 'Date' },
  { accessorKey: 'visit_time', header: 'Time' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'outcome', header: 'Outcome' },
  { accessorKey: 'next_action', header: 'Next Action' }
];

export function SiteVisitTable({ data }: { data: SiteVisit[] }) {
  return <DataTable columns={columns} data={data} />;
}
