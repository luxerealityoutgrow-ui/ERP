import { DataTable, Column } from '@/components/ui/data-table';
import { Property } from '@/lib/queries';

const columns: Column<Property>[] = [
  { key: 'property_code', header: 'Code' },
  { key: 'title', header: 'Title' },
  { key: 'location', header: 'Location' },
  { key: 'price', header: 'Price' },
  { key: 'listing_type', header: 'Type' },
  { key: 'status_id', header: 'Status' }
];

export function PropertyTable({ data }: { data: Property[] }) {
  return <DataTable columns={columns} data={data} />;
}
