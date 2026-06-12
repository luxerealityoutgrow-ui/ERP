import { BarChart } from '@/components/charts/BarChart';

interface LeadSourceChartProps {
  data: { name: string; value: number }[];
}

export function LeadSourceChart({ data }: LeadSourceChartProps) {
  return <BarChart data={data} title="Leads by Source" />;
}
