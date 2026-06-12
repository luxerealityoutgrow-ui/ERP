import { Badge } from '@/components/ui/badge';

export function MatchScoreBadge({ score }: { score: number }) {
  const getVariant = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return <Badge className={getVariant()}>{score}</Badge>;
}
