"use client";
import { useActionState } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPropertyAction, updatePropertyAction } from '@/app/properties/actions';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { TagsInput as TagPicker } from '@/components/ui/tags-input';
import { TagsInput } from '@/components/ui/tags-input';
import { MediaPicker } from '@/components/ui/media-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Building2, MapPin, User, FileText, ImageIcon, DollarSign, Ruler, Trash2, ArrowLeft } from 'lucide-react';

interface PropertyFormProps {
  initialValues?: Partial<any>;
  mode?: 'create' | 'edit';
}

export function PropertyForm({ initialValues = {}, mode = 'create' }: PropertyFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit' && !!initialValues.id;
  const [state, formAction] = useActionState(isEdit ? updatePropertyAction : createPropertyAction, null);
  const [deleting, setDeleting] = useState(false);

  const [configuration, setConfiguration] = useState<string[]>(
    initialValues.configuration ? initialValues.configuration.split(',').map((s: string) => s.trim()) : []
  );
  const [locations, setLocations] = useState<string[]>(
    initialValues.location
      ? initialValues.location.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []
  );
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([]);

  // Fetch locations from DB
  useEffect(() => {
    supabase.from('locations').select('name').order('name').then(({ data }) => {
      if (data) {
        setLocationOptions(data.map(l => ({ value: l.name, label: l.name })));
      }
    });
  }, []);

  // On success, redirect and sync locations
  useEffect(() => {
    if (state?.success) {
      // Auto-add new locations to DB
      if (locations.length > 0) {
        locations.forEach(loc => {
          supabase.from('locations').upsert({ name: loc }, { onConflict: 'name' });
        });
      }
      router.push('/properties');
      router.refresh();
    }
  }, [state]);

  const handleDelete = async () => {
    if (!initialValues.id) return;
    if (!confirm('Are you sure you want to delete this property? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('properties').delete().eq('id', initialValues.id);
      if (!error) {
        router.push('/properties');
        router.refresh();
      } else {
        alert('Failed to delete: ' + error.message);
      }
    } catch (err) {
      alert('Error deleting property');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form action={formAction} className="max-w-5xl mx-auto space-y-8 pb-10">
      {isEdit && <input type="hidden" name="id" value={initialValues.id} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              {isEdit ? 'Edit Property' : 'New Property'}
            </h1>
            <p className="text-sm text-zinc-500">
              {isEdit ? 'Update the property details below.' : 'Add a new listing to your inventory.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <Button type="submit" className="bg-zinc-600 hover:bg-zinc-700 text-white shadow-lg shadow-zinc-500/20 px-6">
            {isEdit ? 'Update Property' : 'Save Property'}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {state?.error && (
        <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-xs font-bold">
          Error: {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Basic Information */}
          <Card className="border-zinc-200/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-zinc-600" />
                <CardTitle className="text-base font-bold">Basic Information</CardTitle>
              </div>
              <CardDescription>Primary details about the property listing.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-bold text-foreground uppercase tracking-wider">Title</Label>
                  <Input id="title" name="title" placeholder="e.g. Modern Luxury Villa" defaultValue={initialValues.title ?? ''} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="property_code" className="text-xs font-bold text-foreground uppercase tracking-wider">Property Code</Label>
                  <Input id="property_code" name="property_code" placeholder="PRP-001" defaultValue={initialValues.property_code ?? ''} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-foreground uppercase tracking-wider">Description</Label>
                <Textarea id="description" name="description" placeholder="Describe the unique features of this property..." defaultValue={initialValues.description ?? ''} rows={4} className="resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="property_type" className="text-xs font-bold text-foreground uppercase tracking-wider">Property Type</Label>
                  <Select name="property_type" defaultValue={initialValues.property_type ?? ''}>
                    <option value="">Select Type</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Duplex">Duplex</option>
                    <option value="Row House">Row House</option>
                    <option value="Bungalow">Bungalow</option>
                    <option value="Independent Building">Independent Building</option>
                    <option value="Plot">Plot</option>
                    <option value="Shop">Shop</option>
                    <option value="Showroom">Showroom</option>
                    <option value="Office">Office</option>
                    <option value="Restaurant Space">Restaurant Space</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="listing_type" className="text-xs font-bold text-foreground uppercase tracking-wider">Listing Type</Label>
                  <Select name="listing_type" defaultValue={initialValues.listing_type ?? ''}> 
                    <option value="">Select Option</option>
                    <option value="Sale">For Sale</option>
                    <option value="Rent">For Rent</option>
                  </Select>
                </div>
              </div>

              {isEdit && (
                <div className="space-y-1.5">
                  <Label htmlFor="status_id" className="text-xs font-bold text-foreground uppercase tracking-wider">Status</Label>
                  <Select name="status_id" defaultValue={initialValues.status_id ?? 'Available'}>
                    <option value="Available">Available</option>
                    <option value="Under Offer">Under Offer</option>
                    <option value="Hold">Hold</option>
                    <option value="Sold">Sold</option>
                    <option value="Rented">Rented</option>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card className="border-zinc-200/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-zinc-600" />
                <CardTitle className="text-base font-bold">Location</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Location / Area</Label>
                <TagsInput
                  value={locations}
                  onChange={setLocations}
                  options={locationOptions}
                  allowCustom={true}
                  placeholder="Type or select locations..."
                />
                <input type="hidden" name="location" value={locations.join(', ')} />
                <p className="text-[10px] text-zinc-400 italic">Select or type custom locations. New locations will be saved for future use.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-bold text-foreground uppercase tracking-wider">Full Address</Label>
                <Textarea id="address" name="address" placeholder="Street name, Building number, Area" defaultValue={initialValues.address ?? ''} rows={2} className="resize-none" />
              </div>
            </CardContent>
          </Card>

          {/* Ownership */}
          <Card className="border-zinc-200/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-600" />
                <CardTitle className="text-base font-bold">Ownership</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="owner_name" className="text-xs font-bold text-foreground uppercase tracking-wider">Owner Name</Label>
                  <Input id="owner_name" name="owner_name" placeholder="Contact person" defaultValue={initialValues.owner_name ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner_contact" className="text-xs font-bold text-foreground uppercase tracking-wider">Owner Contact</Label>
                  <Input id="owner_contact" name="owner_contact" placeholder="+91 90000 00000" defaultValue={initialValues.owner_contact ?? ''} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Pricing & Area */}
          <Card className="border-zinc-200/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-zinc-600" />
                <CardTitle className="text-base font-bold">Pricing & Area</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs font-bold text-foreground uppercase tracking-wider">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">₹</span>
                  <Input id="price" type="number" name="price" className="pl-7" placeholder="e.g. 50000000" defaultValue={initialValues.price ?? ''} />
                </div>
              </div>
              <div className="space-y-4 pt-2 border-t border-zinc-100">
                <div className="space-y-1.5">
                  <Label htmlFor="carpet_area" className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Ruler className="w-3 h-3" /> Carpet Area (sq ft)
                  </Label>
                  <Input id="carpet_area" type="number" name="carpet_area" placeholder="0" defaultValue={initialValues.carpet_area ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="built_up_area" className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-3 h-3" /> Built-up Area (sq ft)
                  </Label>
                  <Input id="built_up_area" type="number" name="built_up_area" placeholder="0" defaultValue={initialValues.built_up_area ?? ''} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card className="border-zinc-200/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-600" />
                <CardTitle className="text-base font-bold">Specifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Configuration (BHK/Rooms)</Label>
                <TagPicker value={configuration} onChange={setConfiguration} />
                <input type="hidden" name="configuration" value={configuration.join(',')} />
                <p className="text-[10px] text-zinc-400 italic">Press enter to add (e.g. 2 BHK, 3 BHK)</p>
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes (edit only) */}
          {isEdit && (
            <Card className="border-zinc-200/80 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-zinc-100">
                <CardTitle className="text-base font-bold">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea name="internal_notes" placeholder="Private notes for the team..." defaultValue={initialValues.internal_notes ?? ''} rows={4} className="resize-none" />
              </CardContent>
            </Card>
          )}

          {/* Media */}
          <Card className="border-zinc-200/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-zinc-600" />
                <CardTitle className="text-base font-bold">Media</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Property Images</Label>
                <MediaPicker bucket="property-images" fieldPrefix="image_" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
