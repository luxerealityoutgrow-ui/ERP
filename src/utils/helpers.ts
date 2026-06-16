// src/utils/helpers.ts
export function getImagePath(image: string): string {
  // In a real app, this would construct the full URL to the image
  // For now, return the image as-is if it's already a full URL
  if (image.startsWith('http') || image.startsWith('/')) {
    return image;
  }
  // Otherwise, assume it's a Supabase storage path
  return `/images/${image}`;
}

export function getCurrencySymbol(): string {
  return '$';
}

export function getPackageFavicon(moduleName: string): string {
  return `/icons/${moduleName}.png`;
}

export function getPackageAlias(moduleName: string): string {
  return moduleName;
}

export function formatAdminCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
