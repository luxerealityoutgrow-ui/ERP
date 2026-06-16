import { BarChart } from '@/components/charts/BarChart';

interface LeadSourceChartProps {
  data: { name: string; value: number }[];
}

export function LeadSourceChart({ data }: LeadSourceChartProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-4">Leads by Source</h3>
      <BarChart data={data} xAxisKey="name" dataKey="value" />
    </div>
  );
}
