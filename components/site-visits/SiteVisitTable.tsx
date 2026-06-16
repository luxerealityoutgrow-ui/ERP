import { DataTable, Column } from '@/components/ui/data-table';
import { SiteVisit } from '@/lib/siteVisits';

const columns: Column<SiteVisit>[] = [
  { key: 'visit_date', header: 'Date' },
  { key: 'visit_time', header: 'Time' },
  { key: 'status', header: 'Status' },
  { key: 'outcome', header: 'Outcome' },
  { key: 'next_action', header: 'Next Action' }
];

export function SiteVisitTable({ data }: { data: SiteVisit[] }) {
  return <DataTable columns={columns} data={data} />;
}
