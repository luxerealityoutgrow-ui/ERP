"use client";
import { useActionState } from 'react';
import { useState } from 'react';
import { createPropertyAction } from '@/app/properties/actions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { TagsInput as TagPicker } from '@/components/ui/tags-input';
import { MediaPicker } from '@/components/ui/media-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Building2, MapPin, User, FileText, ImageIcon, DollarSign, Ruler } from 'lucide-react';

export function PropertyForm({ initialValues = {} }: { initialValues?: Partial<any> }) {
  const [state, formAction] = useActionState(createPropertyAction, null);
  const [configuration, setConfiguration] = useState<string[]>(
    initialValues.configuration ? initialValues.configuration.split(',') : []
  );

  return (
    <form action={formAction} className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Property Details</h1>
          <p className="text-sm text-zinc-500">Manage your real estate listings and their specifications.</p>
        </div>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
          Save Property
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Basic Information */}
          <Card className="border-zinc-200/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
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
                    <option value="Villa">Villa</option>
                    <option value="Row House">Row House</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Plot">Plot</option>
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
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card className="border-zinc-200/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-base font-bold">Location</CardTitle>
              </div>
              <CardDescription>Specify where the property is situated.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-bold text-foreground uppercase tracking-wider">Location / Area</Label>
                <Input id="location" name="location" placeholder="e.g. Beverly Hills, CA" defaultValue={initialValues.location ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-bold text-foreground uppercase tracking-wider">Full Address</Label>
                <Textarea id="address" name="address" placeholder="Street name, Building number, Apt #" defaultValue={initialValues.address ?? ''} rows={2} className="resize-none" />
              </div>
            </CardContent>
          </Card>

          {/* Ownership Information */}
          <Card className="border-zinc-200/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-base font-bold">Ownership</CardTitle>
              </div>
              <CardDescription>Contact information for the property owner.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="owner_name" className="text-xs font-bold text-foreground uppercase tracking-wider">Owner Name</Label>
                  <Input id="owner_name" name="owner_name" placeholder="Contact person" defaultValue={initialValues.owner_name ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner_contact" className="text-xs font-bold text-foreground uppercase tracking-wider">Owner Contact</Label>
                  <Input id="owner_contact" name="owner_contact" placeholder="+1 (555) 000-0000" defaultValue={initialValues.owner_contact ?? ''} />
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
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-base font-bold">Pricing & Area</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs font-bold text-foreground uppercase tracking-wider">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                  <Input id="price" type="number" name="price" className="pl-7" placeholder="0.00" defaultValue={initialValues.price ?? ''} />
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
                <FileText className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-base font-bold">Specifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Configuration (BHK/Rooms)</Label>
                <TagPicker value={configuration} onChange={setConfiguration} />
                <input type="hidden" name="configuration" value={configuration.join(',')} />
                <p className="text-[10px] text-zinc-400 italic">Press enter to add multiple values (e.g. 2 BHK, 3 BHK)</p>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card className="border-zinc-200/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
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

      <div className="flex justify-end pt-6 border-t border-zinc-200">
        <div className="flex gap-3">
          <Button variant="outline" type="button" className="px-8 border-zinc-300 text-zinc-600">Cancel</Button>
          <Button type="submit" className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
            Save Property Listing
          </Button>
        </div>
      </div>
    </form>
  );
}

