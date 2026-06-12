"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ImageSlider } from '@/components/ui/image-slider';

export function PropertyImageGallery({ propertyId }: { propertyId: string }) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from('property_images')
        .select('url')
        .eq('property_id', propertyId);
      if (error) {
        console.error('Error loading images', error);
        return;
      }
      setImages(data.map((img) => img.url));
      setLoading(false);
    };
    fetchImages();
  }, [propertyId]);

  if (loading) return <div>Loading images...</div>;
  if (images.length === 0) return <div>No images available.</div>;

  return <ImageSlider images={images} />;
}
