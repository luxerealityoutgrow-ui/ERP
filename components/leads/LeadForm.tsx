"use client";

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLeadAction, updateLeadAction } from '@/app/leads/actions';
import { TagsInput } from '@/components/ui/tags-input';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, ChevronDown, User, Calendar, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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

const CONFIG_OPTIONS = [
  '1 BHK',
  '2 BHK',
  '3 BHK',
  '4 BHK',
  '5+ BHK',
  'Penthouse',
  'Villa',
  'Studio',
  'Office Space',
  'Plot'
];

export function LeadForm({ initialValues = {} }: { initialValues?: Partial<any> }) {
  const router = useRouter();
  const isEdit = !!initialValues.id;
  const [state, formAction] = useActionState((isEdit ? updateLeadAction : createLeadAction) as any, null);

  // Preferred Locations state
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    initialValues.preferred_location
      ? initialValues.preferred_location.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []
  );

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
  
  const sections = [
    { label: 'Contact' },
    { label: 'Classify & Assign' },
    { label: 'Requirements' },
    { label: 'Notes' }
  ];

  // Fetch real team members from Supabase profiles
  useEffect(() => {
    async function loadTeam() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, role, email')
          .order('full_name');
        if (data && data.length > 0) {
          setTeamProfiles(data);
        } else {
          // Fallback static roster
          setTeamProfiles([
            { id: '29363d68-a8ad-4efb-8fd0-6b6dc29091e7', full_name: 'Saif Bhayani', role: 'Admin' },
            { id: '59d23862-bb84-4bbe-9e70-8c59214f5020', full_name: 'Yohaan Mehta', role: 'Admin' },
            { id: 'e2c5f803-2500-4538-a763-680d7279b4e7', full_name: 'Husain Badri', role: 'SuperAdmin' },
            { id: '33333333-3333-3333-3333-333333333333', full_name: 'Rahul Sharma', role: 'Senior Agent' },
            { id: '44444444-4444-4444-4444-444444444444', full_name: 'Priya Mehta', role: 'SalesPerson' }
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
      router.push('/leads');
      router.refresh();
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

  // ── Render Helpers for Form Sections ──

  const renderContactFields = () => (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em]">Client Name <span className="text-rose-400">*</span></label>
        <input name="client_name" value={formState.client_name} onChange={handleChange} className="w-full h-9 px-3 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all" placeholder="e.g. Rahul Sharma" required />
      </div>
      
      <div className="space-y-1.5">
        <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em]">Phone Number <span className="text-rose-400">*</span></label>
        <input name="phone" value={formState.phone} onChange={handleChange} className="w-full h-9 px-3 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all" placeholder="+91 98452 11002" required />
        <p className="text-[9px] text-zinc-400 italic">Main deciding element. CRM automatically checks for duplicate numbers.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em]">
          Email ID <span className="text-zinc-300 font-semibold">(Optional)</span>
        </label>
        <input type="email" name="email" defaultValue={initialValues.email ?? ''} className="w-full h-9 px-3 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all" placeholder="client@example.com" />
      </div>
    </div>
  );

  const renderClassifyFields = () => (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-[9.5px] font-extrabold text-[#b8922e] uppercase tracking-[0.1em] flex items-center gap-1">
          <User className="h-3 w-3" /> Assigned Representative *
        </label>
        <div className="relative">
          <select 
            name="assigned_to" 
            defaultValue={initialValues.assigned_to ?? ''} 
            className="w-full h-9 px-3 border border-[#d4ad4d]/40 rounded-lg text-[12px] font-bold text-zinc-900 bg-[#fafaf8] focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all appearance-none cursor-pointer"
          >
            <option value="">Select Sales Executive / Admin...</option>
            {teamProfiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.role || 'Executive'})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em] flex items-center gap-1">
          <Calendar className="h-3 w-3 text-zinc-500" /> Next Follow-Up Date
        </label>
        <input 
          type="date" 
          name="next_followup_date" 
          defaultValue={initialValues.next_followup_date ?? ''} 
          className="w-full h-9 px-3 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em]">Lead Source <span className="text-rose-400">*</span></label>
          <div className="relative">
            <select name="lead_source_id" defaultValue={initialValues.lead_source_id ?? 'Google Ads'} className="w-full h-9 px-3 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all appearance-none" required>
              <option value="Google Ads">Google Ads</option>
              <option value="WhatsApp Inbound">WhatsApp Inbound</option>
              <option value="Direct Referral">Direct Referral</option>
              <option value="Housing.com">Housing.com</option>
              <option value="99acres">99acres</option>
              <option value="Magicbricks">Magicbricks</option>
              <option value="Website">Website</option>
              <option value="Walk-in">Walk-in</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em]">Category <span className="text-rose-400">*</span></label>
          <div className="relative">
            <select name="category" defaultValue={initialValues.category ?? 'Residential'} className="w-full h-9 px-3 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all appearance-none" required>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em]">Transaction Type <span className="text-rose-400">*</span></label>
          <div className="relative">
            <select name="transaction_type" defaultValue={initialValues.transaction_type ?? 'Outright'} className="w-full h-9 px-3 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all appearance-none" required>
              <option value="Outright">Outright (Buy)</option>
              <option value="Rent">Rent / Lease</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em]">Pipeline Stage</label>
          <div className="relative">
            <select name="stage_id" defaultValue={initialValues.stage_id ?? 'New inquiry'} className="w-full h-9 px-3 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all appearance-none">
              <option value="New inquiry">New inquiry</option>
              <option value="Site visit">Site visit</option>
              <option value="Follow up">Follow up</option>
              <option value="Closure">Closure</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em]">Status <span className="text-rose-400">*</span></label>
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
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em]">Property Type <span className="text-rose-400">*</span></label>
        <div className="relative">
          <select name="property_type" defaultValue={initialValues.property_type ?? 'Apartment'} className="w-full h-9 px-3 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all appearance-none" required>
            <option value="Apartment">Apartment</option>
            <option value="Villa">Villa / Independent House</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Office Space">Office Space</option>
            <option value="Shop">Shop / Retail</option>
            <option value="Plot">Plot / Land</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em] block">
          Configuration Requirements (Select Multiple: 3 BHK, 4 BHK, 5 BHK) *
        </label>
        <div className="flex flex-wrap gap-2">
          {CONFIG_OPTIONS.map(cfg => {
            const isSelected = selectedConfigs.includes(cfg);
            return (
              <button
                key={cfg}
                type="button"
                onClick={() => toggleConfig(cfg)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
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
        <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em]">Preferred Locations</label>
        <TagsInput
          value={preferredLocations}
          onChange={setPreferredLocations}
          options={LOCATION_OPTIONS}
          allowCustom={true}
          placeholder="Type or select locations..."
        />
        <input type="hidden" name="preferred_location" value={preferredLocations.join(', ')} />
      </div>

      <div className="space-y-1.5">
        <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em]">Max Budget <span className="text-rose-400">*</span></label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[12px] font-bold">₹</span>
          <input type="number" name="budget_max" defaultValue={initialValues.budget_max ?? ''} className="w-full h-9 pl-7 pr-3 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all" placeholder="e.g. 50000000" required />
        </div>
      </div>
    </div>
  );

  const renderNotesFields = () => (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em]">Internal Notes & Requirements</label>
        <textarea name="notes" defaultValue={initialValues.notes ?? ''} className="w-full h-32 p-3 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all resize-none" placeholder="Enter specific timeline, preferred floor, facing, or budget details..." />
      </div>
    </div>
  );

  return (
    <form action={formAction} className="min-h-screen bg-[#fafaf8]">
      {isEdit && <input type="hidden" name="id" value={initialValues.id} />}
      
      {/* Sticky top header bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#ebebeb] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/leads" className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <ChevronLeft className="h-4 w-4 text-zinc-500" />
          </Link>
          <div>
            <h1 className="text-[15px] font-extrabold text-zinc-900 tracking-tight" style={{letterSpacing:'-0.3px'}}>
              {isEdit ? 'Edit Lead' : 'New Lead'}
            </h1>
            <p className="text-[10px] text-zinc-400 font-medium block lg:hidden">Single Scroll Layout</p>
            <p className="text-[10px] text-zinc-400 font-medium hidden lg:block">Luxe Realty Pune · {sections[activeSection].label}</p>
          </div>
        </div>
        <button type="submit" className="dc-btn gold font-bold flex items-center gap-1.5 cursor-pointer">
          Save Lead
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* 🛑 Duplicate Mobile Warning Banner */}
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

              <Link href={`/leads`}>
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

        {/* ── DESKTOP VIEWPORT: Split Panel Dot Wizard Nav ── */}
        <div className="hidden lg:flex" style={{minHeight:'calc(100vh - 65px)'}}>
          
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
          <div className="flex-1 px-8 py-6 max-w-2xl">
            {activeSection === 0 && renderContactFields()}
            {activeSection === 1 && renderClassifyFields()}
            {activeSection === 2 && renderRequirementsFields()}
            {activeSection === 3 && renderNotesFields()}

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
                <button type="submit" className="dc-btn gold font-bold">Save Lead</button>
              )}
            </div>
          </div>
        </div>

        {/* ── MOBILE VIEWPORT: Single Page Scrolling stacked layout ── */}
        <div className="block lg:hidden px-4 py-6 space-y-5">
          
          <div className="bg-white p-5 border border-[#e8e7e4] rounded-[16px] space-y-4">
            <h3 className="text-xs font-black text-zinc-900 border-b border-[#f5f5f3] pb-2 uppercase tracking-wide">1. Contact Details</h3>
            {renderContactFields()}
          </div>

          <div className="bg-white p-5 border border-[#e8e7e4] rounded-[16px] space-y-4">
            <h3 className="text-xs font-black text-zinc-900 border-b border-[#f5f5f3] pb-2 uppercase tracking-wide">2. Classification & Assignment</h3>
            {renderClassifyFields()}
          </div>

          <div className="bg-white p-5 border border-[#e8e7e4] rounded-[16px] space-y-4">
            <h3 className="text-xs font-black text-zinc-900 border-b border-[#f5f5f3] pb-2 uppercase tracking-wide">3. Requirements</h3>
            {renderRequirementsFields()}
          </div>

          <div className="bg-white p-5 border border-[#e8e7e4] rounded-[16px] space-y-4">
            <h3 className="text-xs font-black text-zinc-900 border-b border-[#f5f5f3] pb-2 uppercase tracking-wide">4. Internal Notes</h3>
            {renderNotesFields()}
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full py-3 bg-[#d4ad4d] hover:bg-[#b8922e] text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer">
              Save Lead & Complete
            </button>
          </div>
        </div>

      </div>
    </form>
  );
}
