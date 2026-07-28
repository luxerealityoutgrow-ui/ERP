// BHK-style configuration only makes sense for residential unit types. Commercial/other
// listings (Shop, Office Space, Plot, Showroom, etc.) don't have a BHK configuration --
// their "configuration" should just reflect the property type itself.
export const RESIDENTIAL_TYPES = ['Apartment', 'Penthouse', 'Villa', 'Duplex', 'Triplex', 'Bunglow', 'Rowhouse', 'Row House', 'Building'];

export function isResidentialType(propertyType: string | undefined | null): boolean {
  const t = (propertyType || '').toLowerCase();
  return RESIDENTIAL_TYPES.some(rt => t.includes(rt.toLowerCase()));
}

export function getConfigDisplay(prop: { property_type?: string; configuration?: string }): string {
  if (!isResidentialType(prop.property_type)) {
    return prop.property_type || prop.configuration || '—';
  }
  return prop.configuration || '—';
}

export const BHK_CONFIG_OPTIONS = [
  { value: '1 BHK', label: '1 BHK' },
  { value: '2 BHK', label: '2 BHK' },
  { value: '2.5 BHK', label: '2.5 BHK' },
  { value: '3 BHK', label: '3 BHK' },
  { value: '3.5 BHK', label: '3.5 BHK' },
  { value: '4 BHK', label: '4 BHK' },
  { value: '4.5 BHK', label: '4.5 BHK' },
  { value: '5 BHK', label: '5 BHK' },
  { value: '5.5 BHK', label: '5.5 BHK' },
  { value: '6 BHK', label: '6 BHK' },
  { value: '6.5 BHK', label: '6.5 BHK' },
];

export const COMMERCIAL_CONFIG_OPTIONS = [
  { value: 'Office Space', label: 'Office Space' },
  { value: 'Shop / Retail', label: 'Shop / Retail' },
  { value: 'Showroom', label: 'Showroom' },
  { value: 'Plot / Land', label: 'Plot / Land' },
  { value: 'Commercial Space', label: 'Commercial Space' },
  { value: 'Warehouse', label: 'Warehouse' },
  { value: 'Preleased', label: 'Preleased' },
  { value: 'Bare Shell', label: 'Bare Shell' },
  { value: 'Furnished', label: 'Furnished' },
];
