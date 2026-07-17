"use client";
import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLeadAction, updateLeadAction } from '@/app/leads/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { TagsInput } from '@/components/ui/tags-input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Phone, Mail, MapPin, Building2, Briefcase, DollarSign, Filter } from 'lucide-react';

const LOCATION_OPTIONS = [
  { value: 'Kalyani Nagar', label: 'Kalyani Nagar' },
  { value: 'Koregaon Park', label: 'Koregaon Park' },
  { value: 'Baner', label: 'Baner' },
  { value: 'Viman Nagar', label: 'Viman Nagar' },
  { value: 'Hinjewadi', label: 'Hinjewadi' },
  { value: 'Kharadi', label: 'Kharadi' },
  { value: 'Wakad', label: 'Wakad' },
  { value: 'Aundh', label: 'Aundh' },
  { value: 'Hadapsar', label: 'Hadapsar' },
  { value: 'Magarpatta', label: 'Magarpatta' },
  { value: 'Boat Club Road', label: 'Boat Club Road' },
  { value: 'Camp', label: 'Camp' },
  { value: 'Pimpri-Chinchwad', label: 'Pimpri-Chinchwad' },
  { value: 'Bavdhan', label: 'Bavdhan' },
  { value: 'Pashan', label: 'Pashan' },
];

export function LeadForm({ initialValues = {} }: { initialValues?: Partial<any> }) {
  const router = useRouter();
  const isEdit = !!initialValues.id;
  const [state, formAction] = useActionState(isEdit ? updateLeadAction : createLeadAction, null);
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    initialValues.preferred_location
      ? initialValues.preferred_location.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []
  );

  useEffect(() => {
    if (state?.success) {
      router.push('/leads');
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="max-w-4xl mx-auto space-y-8 pb-10">
      {isEdit && <input type="hidden" name="id" value={initialValues.id} />}
      {state?.error && (
        <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-xs font-bold shadow-xs">
          Error: {state.error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Lead Details</h1>
          <p className="text-sm text-zinc-500">Capture new client requirements and contact information.</p>
        </div>
        <Button type="submit" className="bg-zinc-600 hover:bg-zinc-700 text-white shadow-lg shadow-zinc-500/20 px-8">
          Save Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Contact Information */}
        <Card className="border-zinc-200/80 shadow-sm overflow-hidden md:col-span-2">
          <CardHeader className="border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-600" />
              <CardTitle className="text-base font-bold">Contact Information</CardTitle>
            </div>
            <CardDescription>Primary details to reach the client.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="client_name" className="text-xs font-bold text-foreground uppercase tracking-wider">Client Name <span className="text-rose-500">*</span></Label>
                <Input id="client_name" name="client_name" placeholder="e.g. Rahul Sharma" defaultValue={initialValues.client_name ?? ''} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-foreground uppercase tracking-wider">Phone <span className="text-rose-500">*</span></Label>
                <Input id="phone" name="phone" placeholder="+91 90000 00000" defaultValue={initialValues.phone ?? ''} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-foreground uppercase tracking-wider">Email ID <span className="text-rose-500">*</span></Label>
                <Input id="email" type="email" name="email" placeholder="client@example.com" defaultValue={initialValues.email ?? ''} required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Source & Classification */}
        <Card className="border-zinc-200/80 shadow-sm overflow-hidden md:col-span-2">
          <CardHeader className="border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-600" />
              <CardTitle className="text-base font-bold">Classification</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="lead_source_id" className="text-xs font-bold text-foreground uppercase tracking-wider">Lead Source <span className="text-rose-500">*</span></Label>
                <Select name="lead_source_id" defaultValue={initialValues.lead_source_id ?? ''} required>
                  <option value="">Select Source</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Instagram">Instagram</option>
                  <option value="99 acres">99 acres</option>
                  <option value="Magicbricks">Magicbricks</option>
                  <option value="Walk-in">Walk-in</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-bold text-foreground uppercase tracking-wider">Category <span className="text-rose-500">*</span></Label>
                <Select name="category" defaultValue={initialValues.category ?? ''} required>
                  <option value="">Select Category</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="transaction_type" className="text-xs font-bold text-foreground uppercase tracking-wider">Transaction Type <span className="text-rose-500">*</span></Label>
                <Select name="transaction_type" defaultValue={initialValues.transaction_type ?? ''} required>
                  <option value="">Select Type</option>
                  <option value="Outright">Outright (Buy)</option>
                  <option value="Rent">Rent / Lease</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold text-foreground uppercase tracking-wider">Status <span className="text-rose-500">*</span></Label>
                <Select name="status" defaultValue={initialValues.status ?? 'Hot'} required>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="No answer">No answer</option>
                  <option value="Not reachable">Not reachable</option>
                  <option value="Switched off">Switched off</option>
                  <option value="Closed">Closed</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stage_id" className="text-xs font-bold text-foreground uppercase tracking-wider">Pipeline Stage <span className="text-rose-500">*</span></Label>
                <Select name="stage_id" defaultValue={initialValues.stage_id ?? 'New inquiry'} required>
                  <option value="New inquiry">New inquiry</option>
                  <option value="Site visit">Site visit</option>
                  <option value="Follow up">Follow up</option>
                  <option value="Closure">Closure</option>
                </Select>
              </div>
              <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Active Status</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    value="true"
                    defaultChecked={initialValues.is_active !== false}
                    className="h-4.5 w-4.5 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500/20 cursor-pointer"
                  />
                  <Label htmlFor="is_active" className="text-xs font-medium text-zinc-700 cursor-pointer select-none">Active</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Requirements */}
        <Card className="border-zinc-200/80 shadow-sm overflow-hidden md:col-span-2">
          <CardHeader className="border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-600" />
              <CardTitle className="text-base font-bold">Property Requirements</CardTitle>
            </div>
            <CardDescription>What is the client looking for?</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5">
                <Label htmlFor="property_type" className="text-xs font-bold text-foreground uppercase tracking-wider">Property Type <span className="text-rose-500">*</span></Label>
                <Select name="property_type" defaultValue={initialValues.property_type ?? ''} required>
                  <option value="">Select Property Type</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa / Independent House</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Office Space">Office Space</option>
                  <option value="Shop">Shop / Retail</option>
                  <option value="Plot">Plot / Land</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="configuration" className="text-xs font-bold text-foreground uppercase tracking-wider">Configuration (BHK) <span className="text-rose-500">*</span></Label>
                <Select name="configuration" defaultValue={initialValues.configuration ?? ''} required>
                  <option value="">Select Configuration</option>
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                  <option value="5+ BHK">5+ BHK</option>
                  <option value="Studio">Studio</option>
                  <option value="N/A">N/A (Commercial/Plot)</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preferred_location" className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Preferred Locations <span className="text-rose-500">*</span></Label>
                <TagsInput
                  value={preferredLocations}
                  onChange={setPreferredLocations}
                  options={LOCATION_OPTIONS}
                  allowCustom={true}
                  placeholder="Type or select locations..."
                />
                <input type="hidden" name="preferred_location" value={preferredLocations.join(', ')} />
                <p className="text-[10px] text-zinc-400 italic">Select from suggestions or type custom locations and press Enter</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="budget_max" className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5"/> Max Budget <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">₹</span>
                  <Input id="budget_max" type="number" name="budget_max" className="pl-7" placeholder="e.g. 50000000" defaultValue={initialValues.budget_max ?? ''} required />
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card className="border-zinc-200/80 shadow-sm overflow-hidden md:col-span-2">
          <CardHeader className="border-b border-zinc-100">
            <CardTitle className="text-base font-bold">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-bold text-foreground uppercase tracking-wider">Internal Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Any specific requirements or context..." defaultValue={initialValues.notes ?? ''} rows={4} className="resize-none" />
            </div>
          </CardContent>
        </Card>

      </div>
      
      <div className="flex justify-end pt-4">
        <Button type="submit" className="px-8 bg-zinc-600 hover:bg-zinc-700 text-white shadow-lg shadow-zinc-500/20">
          Save Lead
        </Button>
      </div>
    </form>
  );
}
