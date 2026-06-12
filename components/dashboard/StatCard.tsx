interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export function StatCard({ title, value, icon, color = 'blue' }: StatCardProps) {
  const colorClass = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700'
  }[color];

  return (
    <div className={`p-4 rounded-lg shadow ${colorClass} flex items-center`}>
      <div className="text-2xl mr-4">{icon}</div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}
