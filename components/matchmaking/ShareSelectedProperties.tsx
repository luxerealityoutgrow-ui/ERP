"use client";
import { Button } from '@/components/ui/button';

export function ShareSelectedProperties({ selectedIds }: { selectedIds: string[] }) {
  const handleShare = () => {
    console.log('Share selected properties:', selectedIds);
    // Generate share links
    selectedIds.forEach((id) => {
      const shareUrl = `${window.location.origin}/shared/${id}`;
      // Simple WhatsApp share
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check this property: ${shareUrl}`)}`;
      window.open(whatsappUrl, '_blank');
    });
  };

  return <Button onClick={handleShare}>Share Selected</Button>;
}
