"use client";

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createLeadAction, updateLeadAction } from '@/app/leads/actions';
import { TagsInput } from '@/components/ui/tags-input';
import { IndianNumberInput } from '@/components/ui/indian-number-input';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, ChevronDown, User, Calendar, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const CONFIG_OPTIONS = [
  '1 BHK',
  '2 BHK',
  '2.5 BHK',
  '3 BHK',
  '3.5 BHK',
  '4 BHK',
  '4.5 BHK',
  '5 BHK',
  '5.5 BHK',
  '6 BHK',
  '6.5 BHK',
  'Penthouse',
  'Studio',
  'Office Space',
  'Plot',
  'Bunglow',
  'Restaurant',
  'Shop',
  'Rowhouse',
  'Showroom',
  'Duplex',
  'Triplex',
  'Building'
];

const inputCls = "w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base lg:text-[12px] font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all";
const selectCls = "w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base lg:text-[12px] font-semibold text-zinc-800 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all appearance-none cursor-pointer";
const textareaCls = "w-full px-3.5 py-2.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base lg:text-[12px] font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all resize-none";
const labelCls = "text-[10px] font-bold text-zinc-400 uppercase tracking-widest";

export function LeadForm({ initialValues = {} }: { initialValues?: Partial<any> }) {
  const router = useRouter();
  const isEdit = !!initialValues.id;
  const [state, formAction, isPending] = useActionState((isEdit ? updateLeadAction : createLeadAction) as any, null);

  // Only one layout (desktop wizard or mobile single-scroll) is ever mounted at a time,
  // matching the lg: (1024px) breakpoint the rest of the app uses. Previously both were
  // always mounted with CSS display toggling, which duplicated every field's `name`
  // attribute in the same <form> -- the hidden copy stayed empty, so native `required`
  // validation silently blocked every submission with no visible error.
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Preferred Locations state
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    initialValues.preferred_location
      ? initialValues.preferred_location.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []
  );
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    supabase.from('locations').select('name').order('name').then(({ data }) => {
      if (data) setLocationOptions(data.map(l => ({ value: l.name, label: l.name })));
    });
  }, []);

  // Multi-select BHK Configuration state
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>(
    initialValues.configuration
      ? initialValues.configuration.split(',').map((s: string) => s.trim()).filter(Boolean)
      : ['3 BHK']
  );

  // Team Profiles list for "Assign To" dropdown
  const [teamProfiles, setTeamProfiles] = useState<any[]>([]);

  const [activeSection, setActiveSection] = useState(0);
  const [formState, setFormState] = useState({ 
    client_name: initialValues.client_name ?? '', 
    phone: initialValues.phone ?? '', 
    status: initialValues.status ?? 'Hot' 
  });
  const [previewBudgetMax, setPreviewBudgetMax] = useState(initialValues.budget_max ?? '');

  function formatPrice(v: string | number) {
    const n = parseFloat(String(v));
    if (!n) return '';
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, '')} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  }
  
  const sections = [
    { label: 'Contact' },
    { label: 'Classify & Assign' },
    { label: 'Requirements' },
    { label: 'Notes' }
  ];

  // Fetch real team members from Supabase profiles (all assignable roles)
  useEffect(() => {
    async function loadTeam() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, role, email')
          .in('role', ['SalesPerson', 'Admin', 'SuperAdmin', 'Senior Agent'])
          .order('full_name');
        if (data && data.length > 0) {
          setTeamProfiles(data);
        } else {
          // Fallback static roster
          setTeamProfiles([
            { id: '29363d68-a8ad-4efb-8fd0-6b6dc29091e7', full_name: 'Saif Bhayani', role: 'Admin' },
            { id: '59d23862-bb84-4bbe-9e70-8c59214f5020', full_name: 'Yohaan Mehta', role: 'SalesPerson' },
            { id: 'e2c5f803-2500-4538-a763-680d7279b4e7', full_name: 'Husain Badri', role: 'SuperAdmin' },
            { id: '540b2e7f-12f5-4d62-9aaf-089da959dfb7', full_name: 'Benazir Bhayani', role: 'SalesPerson' },
            { id: '6d202aad-3e6e-4568-b6d2-1c236c770ef5', full_name: 'Hamirr Jobnputra', role: 'SalesPerson' },
            { id: '1b973ead-d1b0-4500-8dca-d9b329affce9', full_name: 'Rishi Mahboobani', role: 'SalesPerson' },
            { id: 'feacdf8b-e875-4dd0-ac62-692982e27835', full_name: 'Shriram Boyane', role: 'SalesPerson' },
          ]);
        }
      } catch (err) {
        console.error('Error loading team profiles:', err);
      }
    }
    loadTeam();
  }, []);

  useEffect(() => {
    if ((state as any)?.success) {
      toast.success(isEdit ? 'Lead updated successfully' : 'Lead saved successfully');
      if (preferredLocations.length > 0) {
        preferredLocations.forEach(loc => {
          supabase.from('locations').upsert({ name: loc }, { onConflict: 'name' });
        });
      }
      router.push('/leads');
      router.refresh();
    } else if ((state as any)?.duplicate) {
      toast.error('A lead with this mobile number already exists.');
    } else if ((state as any)?.error) {
      toast.error((state as any).error);
    }
  }, [state, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleConfig = (cfg: string) => {
    setSelectedConfigs(prev =>
      prev.includes(cfg) ? prev.filter(c => c !== cfg) : [...prev, cfg]
    );
  };

  // Required fields are validated here rather than via the native `required` attribute:
  // whichever wizard section isn't currently active is display:none, and a hidden required
  // field can't be focused by the browser to show its validation error -- it just silently
  // blocks submission instead. This runs on submit, jumps to the offending section, and
  // shows a toast so the failure is actually visible.
  function validateRequiredFields(): boolean {
    if (!formState.client_name.trim()) {
      toast.error('Client Name is required.');
      setActiveSection(0);
      return false;
    }
    if (!formState.phone.trim()) {
      toast.error('Phone Number is required.');
      setActiveSection(0);
      return false;
    }
    if (!previewBudgetMax || !String(previewBudgetMax).trim()) {
      toast.error('Max Budget is required.');
      setActiveSection(2);
      return false;
    }
    return true;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!validateRequiredFields()) {
      e.preventDefault();
    }
  };

  // ── Render Helpers for Form Sections ──

  const renderContactFields = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className={labelCls}>Client Name <span className="text-rose-500/80">*</span></label>
        <input name="client_name" value={formState.client_name} onChange={handleChange} className={inputCls} placeholder="e.g. Rahul Sharma" />
      </div>
      
      <div className="space-y-1.5">
        <label className={labelCls}>Phone Number <span className="text-rose-500/80">*</span></label>
        <input name="phone" value={formState.phone} onChange={handleChange} className={inputCls} placeholder="+91 98452 11002" />
        <p className="text-[10px] text-zinc-400 italic font-medium">Main deciding element. CRM automatically checks for duplicate numbers.</p>
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>
          Email ID <span className="text-zinc-300 font-semibold">(Optional)</span>
        </label>
        <input type="email" name="email" defaultValue={initialValues.email ?? ''} className={inputCls} placeholder="client@example.com" />
      </div>
    </div>
  );

  const renderClassifyFields = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-[#b8922e] uppercase tracking-widest flex items-center gap-1">
          <User className="h-3.5 w-3.5" /> Assigned Representative *
        </label>
        <div className="relative">
          <select 
            name="assigned_to" 
            defaultValue={initialValues.assigned_to ?? ''} 
            className={selectCls + " border-[#d4ad4d]/40 font-bold"}
          >
            <option value="">Select Sales Executive / Admin...</option>
            {teamProfiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.role || 'Executive'})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-zinc-400" /> Next Follow-Up Date
        </label>
        <input 
          type="date" 
          name="next_followup_date" 
          defaultValue={initialValues.next_followup_date ?? ''} 
          className={inputCls} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelCls}>Lead Source *</label>
          <div className="relative">
            <select name="lead_source_id" defaultValue={initialValues.lead_source_id ?? 'Google Ads'} className={selectCls}>
              <option value="Google Ads">Google Ads</option>
              <option value="WhatsApp Inbound">WhatsApp Inbound</option>
              <option value="Direct Referral">Direct Referral</option>
              <option value="Housing.com">Housing.com</option>
              <option value="99acres">99acres</option>
              <option value="Magicbricks">Magicbricks</option>
              <option value="Website">Website</option>
              <option value="Walk-in">Walk-in</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Category *</label>
          <div className="relative">
            <select name="category" defaultValue={initialValues.category ?? 'Residential'} className={selectCls}>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelCls}>Transaction Type *</label>
          <div className="relative">
            <select name="transaction_type" defaultValue={initialValues.transaction_type ?? 'Outright'} className={selectCls}>
              <option value="Outright">Outright (Buy)</option>
              <option value="Rent">Rent / Lease</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Pipeline Stage</label>
          <div className="relative">
            <select name="stage_id" defaultValue={initialValues.stage_id ?? 'New inquiry'} className={selectCls}>
              <option value="New inquiry">New inquiry</option>
              <option value="Site visit">Site visit</option>
              <option value="Follow up">Follow up</option>
              <option value="Closure">Closure</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Status *</label>
        <div className="flex flex-wrap gap-2">
          <input type="hidden" name="status" value={formState.status} />
          {['Hot', 'Warm', 'No answer', 'Not reachable', 'Switched off', 'Closed'].map(st => {
            const isSelected = formState.status === st;
            let bg = 'bg-zinc-50 text-zinc-500 border-zinc-200';
            if (isSelected) {
              bg = st === 'Hot' ? 'bg-rose-500 text-white border-rose-500' :
                   st === 'Warm' ? 'bg-amber-500 text-white border-amber-500' :
                   'bg-zinc-600 text-white border-zinc-600';
            } else {
              bg = st === 'Hot' ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' :
                   st === 'Warm' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' :
                   'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100';
            }
            return (
              <button key={st} type="button" onClick={() => setFormState(prev => ({...prev, status: st}))}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${bg}`}>
                {st}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="is_active" value="true" defaultChecked={initialValues.is_active !== false} className="h-4 w-4 rounded border-[#e8e7e4] text-[#d4ad4d] focus:ring-[#d4ad4d]/20 transition-all cursor-pointer" />
          <span className="text-[12px] font-bold text-zinc-700 select-none">Active Lead</span>
        </label>
      </div>
    </div>
  );

  const renderRequirementsFields = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className={labelCls}>Property Type *</label>
        <div className="relative">
          <select name="property_type" defaultValue={initialValues.property_type ?? 'Apartment'} className={selectCls}>
            <option value="Apartment">Apartment</option>
            <option value="Villa">Villa / Independent House</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Office Space">Office Space</option>
            <option value="Shop">Shop / Retail</option>
            <option value="Plot">Plot / Land</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelCls}>
          Configuration Requirements (Select Multiple) *
        </label>
        <div className="flex flex-wrap gap-2">
          {CONFIG_OPTIONS.map(cfg => {
            const isSelected = selectedConfigs.includes(cfg);
            return (
              <button
                key={cfg}
                type="button"
                onClick={() => toggleConfig(cfg)}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                    : 'bg-white text-zinc-600 border-[#e8e7e4] hover:bg-zinc-50'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}{cfg}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="configuration" value={selectedConfigs.join(', ')} />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Preferred Locations</label>
        <TagsInput
          value={preferredLocations}
          onChange={setPreferredLocations}
          options={locationOptions}
          allowCustom={true}
          placeholder="Type or select locations..."
        />
        <input type="hidden" name="preferred_location" value={preferredLocations.join(', ')} />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Max Budget *</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-base lg:text-[12px] font-bold">₹</span>
          <IndianNumberInput
            name="budget_max"
            defaultValue={initialValues.budget_max ?? ''}
            className={inputCls + " pl-7"}
            placeholder="e.g. 5,00,00,000"
            onValueChange={setPreviewBudgetMax}
          />
        </div>
        {previewBudgetMax && (
          <div className="text-[11px] font-bold text-[#d4ad4d] mt-1">
            {formatPrice(previewBudgetMax)}
          </div>
        )}
      </div>
    </div>
  );

  const renderNotesFields = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className={labelCls}>Internal Notes & Requirements</label>
        <textarea name="notes" defaultValue={initialValues.notes ?? ''} className={textareaCls + " h-32"} placeholder="Enter specific timeline, preferred floor, facing, or budget details..." />
      </div>
    </div>
  );

  return (
    <form action={formAction} onSubmit={handleSubmit} className="min-h-screen bg-[#fafaf8]">
      {isEdit && <input type="hidden" name="id" value={initialValues.id} />}

      {/* Sticky top header bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#ebebeb] px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between gap-3">
        <Link href="/leads" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 transition-colors shrink-0">
          <ChevronLeft className="h-4 w-4" />
          <span className="text-xs font-semibold hidden sm:block">Back to Leads</span>
        </Link>
        <h1 className="text-[15px] font-extrabold text-zinc-900 tracking-tight flex-1 text-center lg:text-left" style={{letterSpacing:'-0.3px'}}>
          {isEdit ? 'Edit Lead' : 'New Lead'}
        </h1>
        <button type="submit" disabled={isPending} className="dc-btn gold font-bold flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-not-allowed">
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isPending ? 'Saving…' : 'Save Lead'}
        </button>
      </div>

      <div className="lg:max-w-4xl lg:mx-auto">
        {/* 🛑 Duplicate Warning Banner */}
        {(state as any)?.duplicate && (state as any)?.existingLead && (
          <div className="m-4 lg:mx-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 text-left">
            <div className="flex items-center gap-2.5 text-rose-700">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wide">Duplicate Mobile Number Blocked</h4>
                <p className="text-[11px] font-medium text-rose-600 mt-0.5">
                  A lead with mobile number <strong>{(state as any).existingLead.phone}</strong> already exists in your CRM database!
                </p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-rose-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-extrabold text-zinc-900">{(state as any).existingLead.client_name}</span>
                <div className="text-[10px] text-zinc-500 font-bold mt-0.5">
                  Assigned Representative: <span className="text-[#b8922e]">{(state as any).existingLead.assigneeName}</span>
                </div>
              </div>

              <Link href={`/leads/${(state as any).existingLead.id}`}>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-[11px] font-bold hover:bg-zinc-800 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>View Existing Lead</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </Link>
            </div>
          </div>
        )}

        {(state as any)?.error && !(state as any)?.duplicate && (
          <div className="m-4 lg:mx-8 p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[11px] font-bold">
            Error: {(state as any).error}
          </div>
        )}

        {/* Only one of these layouts is ever mounted (see isDesktop above) -- previously
            both were always mounted with CSS show/hide, duplicating every field's name
            attribute in this <form> and breaking both validation and submitted values. */}
        {isDesktop ? (
        /* ── DESKTOP VIEWPORT: Split Panel Dot Wizard Nav ── */
        <div className="flex" style={{minHeight:'calc(100vh - 65px)'}}>

          {/* Left section navigation */}
          <div className="w-[200px] shrink-0 border-r border-[#ebebeb] bg-white pt-6 pb-10">
            {sections.map((s, i) => (
              <button type="button" key={i} onClick={() => setActiveSection(i)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all border-r-2 ${
                  activeSection === i
                    ? 'border-[#d4ad4d] bg-zinc-50 text-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'
                }`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  i < activeSection ? 'bg-[#d4ad4d]' : activeSection === i ? 'bg-[#d4ad4d] ring-4 ring-[#d4ad4d]/20' : 'bg-[#e8e7e4]'
                }`} />
                <span className="text-[11px] font-700">{s.label}</span>
              </button>
            ))}
            
            {/* Live preview card */}
            {(formState.client_name || formState.phone) && (
              <div className="mx-4 mt-6 p-3 bg-[#fafaf8] border border-[#ebebeb] rounded-xl">
                <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-wider mb-2">Preview</div>
                <div className="text-[11px] font-extrabold text-zinc-900">{formState.client_name || '—'}</div>
                <div className="text-[9.5px] text-zinc-400 mt-0.5">{formState.phone}</div>
                {formState.status && (
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-[8.5px] font-bold ${
                      formState.status === 'Hot' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                      formState.status === 'Warm' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-zinc-50 text-zinc-500 border border-zinc-200'
                    }`}>{formState.status}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Right content panel */}
          {/* Sections stay mounted (display:none when inactive) rather than unmounting,
              so fields from earlier sections are still present in FormData when submitting
              from a later section — otherwise saving from the last page would silently
              drop required fields like client_name/phone and fail. */}
          <div className="flex-1 px-8 py-6 max-w-2xl text-left">
            <div style={{ display: activeSection === 0 ? 'block' : 'none' }}>{renderContactFields()}</div>
            <div style={{ display: activeSection === 1 ? 'block' : 'none' }}>{renderClassifyFields()}</div>
            <div style={{ display: activeSection === 2 ? 'block' : 'none' }}>{renderRequirementsFields()}</div>
            <div style={{ display: activeSection === 3 ? 'block' : 'none' }}>{renderNotesFields()}</div>

            {/* Bottom navigation bar */}
            <div className="mt-8 flex items-center justify-between pt-4 border-t border-[#ebebeb]">
              {activeSection > 0 ? (
                <button type="button" onClick={() => setActiveSection(s => s-1)}
                  className="text-[11px] font-bold text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors">
                  ← {sections[activeSection-1].label}
                </button>
              ) : <span />}
              {activeSection < sections.length - 1 ? (
                <button type="button" onClick={() => setActiveSection(s => s+1)}
                  className="dc-btn font-bold text-[11px] flex items-center gap-1">
                  {sections[activeSection+1].label} →
                </button>
              ) : (
                <button type="submit" disabled={isPending} className="dc-btn gold font-bold flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isPending ? 'Saving…' : 'Save Lead'}
                </button>
              )}
            </div>
          </div>
        </div>
        ) : (
        /* ── MOBILE VIEWPORT: Single Page Scrolling stacked layout ── */
        <div className="text-left space-y-0 bg-white">
          
          <div className="px-5 pt-6 pb-5 border-b border-zinc-100 space-y-4">
            <h3 className="text-[11px] font-black text-zinc-900 pb-2.5 uppercase tracking-wider flex items-baseline gap-2 border-b border-zinc-100">
              <span className="font-serif italic font-bold text-[#d4ad4d] text-sm">01.</span>
              <span>Contact Details</span>
            </h3>
            {renderContactFields()}
          </div>

          <div className="px-5 pt-6 pb-5 border-b border-zinc-100 space-y-4">
            <h3 className="text-[11px] font-black text-zinc-900 pb-2.5 uppercase tracking-wider flex items-baseline gap-2 border-b border-zinc-100">
              <span className="font-serif italic font-bold text-[#d4ad4d] text-sm">02.</span>
              <span>Classification & Assignment</span>
            </h3>
            {renderClassifyFields()}
          </div>

          <div className="px-5 pt-6 pb-5 border-b border-zinc-100 space-y-4">
            <h3 className="text-[11px] font-black text-zinc-900 pb-2.5 uppercase tracking-wider flex items-baseline gap-2 border-b border-zinc-100">
              <span className="font-serif italic font-bold text-[#d4ad4d] text-sm">03.</span>
              <span>Requirements</span>
            </h3>
            {renderRequirementsFields()}
          </div>

          <div className="px-5 pt-6 pb-8 space-y-4">
            <h3 className="text-[11px] font-black text-zinc-900 pb-2.5 uppercase tracking-wider flex items-baseline gap-2 border-b border-zinc-100">
              <span className="font-serif italic font-bold text-[#d4ad4d] text-sm">04.</span>
              <span>Internal Notes</span>
            </h3>
            {renderNotesFields()}
          </div>
        </div>
        )}

      </div>
    </form>
  );
}
