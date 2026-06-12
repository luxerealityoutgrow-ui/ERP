import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Property } from '@/lib/queries';

const columns: ColumnDef<Property>[] = [
  { accessorKey: 'property_code', header: 'Code' },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'location', header: 'Location' },
  { accessorKey: 'price', header: 'Price' },
  { accessorKey: 'listing_type', header: 'Type' },
  { accessorKey: 'status_id', header: 'Status' }
];

export function PropertyTable({ data }: { data: Property[] }) {
  return <DataTable columns={columns} data={data} />;
}
