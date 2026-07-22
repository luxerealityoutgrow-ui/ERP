"use client";
import { useActionState } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPropertyAction, updatePropertyAction } from '@/app/properties/actions';
import { supabase } from '@/lib/supabaseClient';
import { TagsInput as TagPicker } from '@/components/ui/tags-input';
import { TagsInput } from '@/components/ui/tags-input';
import { MediaPicker } from '@/components/ui/media-picker';
import { Building2, MapPin, User, ImageIcon, DollarSign, Ruler, Trash2, ChevronLeft, ChevronDown, FileText } from 'lucide-react';
import Link from 'next/link';

interface PropertyFormProps {
  initialValues?: Partial<any>;
  mode?: 'create' | 'edit';
}

const SECTIONS = [
  { label: 'Basic Info', icon: Building2 },
  { label: 'Location', icon: MapPin },
  { label: 'Pricing & Area', icon: DollarSign },
  { label: 'Ownership', icon: User },
  { label: 'Media', icon: ImageIcon },
];

const inputCls = "w-full h-9 px-3 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all placeholder:text-zinc-300";
const selectCls = "w-full h-9 px-3 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all appearance-none cursor-pointer";
const labelCls = "text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.1em]";
const textareaCls = "w-full px-3 py-2.5 border border-[#e8e7e4] rounded-lg text-[12px] font-medium text-zinc-800 bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all resize-none placeholder:text-zinc-300";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className={labelCls}>
      {children}
      {required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
  );
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
    </div>
  );
}

export function PropertyForm({ initialValues = {}, mode = 'create' }: PropertyFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit' && !!initialValues.id;
  const [state, formAction] = useActionState(isEdit ? updatePropertyAction : createPropertyAction, null);
  const [deleting, setDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const [configuration, setConfiguration] = useState<string[]>(
    initialValues.configuration ? initialValues.configuration.split(',').map((s: string) => s.trim()) : []
  );
  const [locations, setLocations] = useState<string[]>(
    initialValues.location
      ? initialValues.location.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []
  );
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([]);

  // Live preview state
  const [previewTitle, setPreviewTitle] = useState(initialValues.title || '');
  const [previewPrice, setPreviewPrice] = useState(initialValues.price || '');
  const [previewType, setPreviewType] = useState(initialValues.property_type || '');

  useEffect(() => {
    supabase.from('locations').select('name').order('name').then(({ data }) => {
      if (data) setLocationOptions(data.map(l => ({ value: l.name, label: l.name })));
    });
  }, []);

  useEffect(() => {
    if (state?.success) {
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
      if (!error) { router.push('/properties'); router.refresh(); }
      else alert('Failed to delete: ' + error.message);
    } catch { alert('Error deleting property'); }
    finally { setDeleting(false); }
  };

  function formatPrice(v: string | number) {
    const n = parseFloat(String(v));
    if (!n) return '';
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, '')} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  }

  return (
    <form action={formAction} className="min-h-screen bg-[#fafaf8]">
      {isEdit && <input type="hidden" name="id" value={initialValues.id} />}

      {/* Sticky top header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#ebebeb] px-6 py-4 flex items-center justify-between shadow-[0_1px_0_0_#ebebeb]">
        <div className="flex items-center gap-3">
          <Link href="/properties" className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <ChevronLeft className="h-4 w-4 text-zinc-500" />
          </Link>
          <div>
            <h1 className="text-[15px] font-extrabold text-zinc-900" style={{ letterSpacing: '-0.3px' }}>
              {isEdit ? 'Edit Property' : 'New Property'}
            </h1>
            <p className="text-[10px] text-zinc-400 font-medium">
              Luxe Realty Pune · {SECTIONS[activeSection].label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-600 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 transition-all disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#d4ad4d] text-white text-[11px] font-bold hover:bg-[#b8922e] transition-all shadow-[0_2px_8px_rgba(212,173,77,.35)]"
          >
            {isEdit ? 'Update Property' : 'Save Property'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {state?.error && (
        <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-[11px] font-bold">
          Error: {state.error}
        </div>
      )}

      {/* Split panel: left nav + right fields */}
      <div className="flex" style={{ minHeight: 'calc(100vh - 65px)' }}>

        {/* Left navigation */}
        <div className="w-[200px] shrink-0 border-r border-[#ebebeb] bg-white pt-6 pb-10">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSection(i)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all border-r-2 ${
                  activeSection === i
                    ? 'border-[#d4ad4d] bg-zinc-50 text-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 transition-all ${
                    i < activeSection
                      ? 'bg-[#d4ad4d]'
                      : activeSection === i
                      ? 'bg-[#d4ad4d] ring-4 ring-[#d4ad4d]/20'
                      : 'bg-[#e8e7e4]'
                  }`}
                />
                <span className="text-[11px] font-bold">{s.label}</span>
              </button>
            );
          })}

          {/* Live preview card */}
          {(previewTitle || previewType) && (
            <div className="mx-3 mt-6 p-3 bg-[#fafaf8] border border-[#ebebeb] rounded-xl">
              <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-wider mb-2">Preview</div>
              {previewTitle && (
                <div className="text-[11px] font-extrabold text-zinc-900 leading-tight">{previewTitle}</div>
              )}
              {previewType && (
                <div className="text-[9.5px] text-zinc-400 mt-1">{previewType}</div>
              )}
              {previewPrice && (
                <div className="text-[11px] font-bold text-[#d4ad4d] mt-1.5">{formatPrice(previewPrice)}</div>
              )}
              {locations.length > 0 && (
                <div className="text-[9px] text-zinc-400 mt-1 flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  {locations.slice(0, 2).join(', ')}
                  {locations.length > 2 && ` +${locations.length - 2}`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right fields */}
        <div className="flex-1 px-8 py-6 max-w-2xl">

          {/* ── SECTION 0: Basic Info ── */}
          {activeSection === 0 && (
            <div className="space-y-5">
              <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.15em] mb-4">Basic Information</div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel required>Property Title</FieldLabel>
                  <input
                    name="title"
                    className={inputCls}
                    placeholder="e.g. Modern Luxury Villa"
                    defaultValue={initialValues.title ?? ''}
                    required
                    onChange={e => setPreviewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Property Code</FieldLabel>
                  <input name="property_code" className={inputCls} placeholder="PRP-001" defaultValue={initialValues.property_code ?? ''} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel>Property Type</FieldLabel>
                  <SelectWrapper>
                    <select
                      name="property_type"
                      className={selectCls}
                      defaultValue={initialValues.property_type ?? ''}
                      onChange={e => setPreviewType(e.target.value)}
                    >
                      <option value="">Select Type</option>
                      <option>Apartment</option>
                      <option>Penthouse</option>
                      <option>Duplex</option>
                      <option>Row House</option>
                      <option>Bungalow</option>
                      <option>Independent Building</option>
                      <option>Plot</option>
                      <option>Shop</option>
                      <option>Showroom</option>
                      <option>Office</option>
                      <option>Restaurant Space</option>
                    </select>
                  </SelectWrapper>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Listing Type</FieldLabel>
                  <SelectWrapper>
                    <select name="listing_type" className={selectCls} defaultValue={initialValues.listing_type ?? ''}>
                      <option value="">Select Option</option>
                      <option value="Sale">For Sale</option>
                      <option value="Rent">For Rent</option>
                    </select>
                  </SelectWrapper>
                </div>
              </div>

              {isEdit && (
                <div className="space-y-1.5">
                  <FieldLabel>Status</FieldLabel>
                  <SelectWrapper>
                    <select name="status_id" className={selectCls} defaultValue={initialValues.status_id ?? 'Available'}>
                      <option>Available</option>
                      <option>Under Offer</option>
                      <option>Hold</option>
                      <option>Sold</option>
                      <option>Rented</option>
                    </select>
                  </SelectWrapper>
                </div>
              )}

              <div className="space-y-1.5">
                <FieldLabel>Description</FieldLabel>
                <textarea
                  name="description"
                  className={textareaCls}
                  rows={4}
                  placeholder="Describe the unique features of this property..."
                  defaultValue={initialValues.description ?? ''}
                />
              </div>
            </div>
          )}

          {/* ── SECTION 1: Location ── */}
          {activeSection === 1 && (
            <div className="space-y-5">
              <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.15em] mb-4">Location Details</div>
              <div className="space-y-1.5">
                <FieldLabel>Location / Area</FieldLabel>
                <TagsInput
                  value={locations}
                  onChange={setLocations}
                  options={locationOptions}
                  allowCustom={true}
                  placeholder="Type or select locations..."
                />
                <input type="hidden" name="location" value={locations.join(', ')} />
                <p className="text-[9.5px] text-zinc-400 italic">Select or type custom locations. New ones will be saved for future use.</p>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Full Address</FieldLabel>
                <textarea
                  name="address"
                  className={textareaCls}
                  rows={2}
                  placeholder="Street name, Building number, Area"
                  defaultValue={initialValues.address ?? ''}
                />
              </div>
            </div>
          )}

          {/* ── SECTION 2: Pricing & Area ── */}
          {activeSection === 2 && (
            <div className="space-y-5">
              <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.15em] mb-4">Pricing & Area</div>
              <div className="space-y-1.5">
                <FieldLabel>Price (₹)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[12px] font-medium">₹</span>
                  <input
                    type="number"
                    name="price"
                    className={inputCls + ' pl-7'}
                    placeholder="e.g. 50000000"
                    defaultValue={initialValues.price ?? ''}
                    onChange={e => setPreviewPrice(e.target.value)}
                  />
                </div>
                {previewPrice && (
                  <p className="text-[10px] font-bold text-[#d4ad4d]">= {formatPrice(previewPrice)}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel>Carpet Area (sq ft)</FieldLabel>
                  <div className="relative">
                    <input
                      type="number"
                      name="carpet_area"
                      className={inputCls}
                      placeholder="0"
                      defaultValue={initialValues.carpet_area ?? ''}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Built-up Area (sq ft)</FieldLabel>
                  <input
                    type="number"
                    name="built_up_area"
                    className={inputCls}
                    placeholder="0"
                    defaultValue={initialValues.built_up_area ?? ''}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Configuration (BHK/Rooms)</FieldLabel>
                <TagPicker value={configuration} onChange={setConfiguration} />
                <input type="hidden" name="configuration" value={configuration.join(',')} />
                <p className="text-[9.5px] text-zinc-400 italic">Press enter to add (e.g. 2 BHK, 3 BHK)</p>
              </div>
            </div>
          )}

          {/* ── SECTION 3: Private Ownership & Terms ── */}
          {activeSection === 3 && (
            <div className="space-y-5">
              <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.15em] mb-4">Ownership & Private Terms</div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel>Owner Name</FieldLabel>
                  <input name="owner_name" className={inputCls} placeholder="Contact person" defaultValue={initialValues.owner_name ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Owner Contact</FieldLabel>
                  <input name="owner_contact" className={inputCls} placeholder="+91 90000 00000" defaultValue={initialValues.owner_contact ?? ''} />
                </div>
              </div>

              {/* DEDICATED PRIVATE FIELDS: UNIT NO & BROKERAGE (KEPT PRIVATE FROM WHATSAPP SHARE COPY) */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <FieldLabel>Apartment / Unit No (Private)</FieldLabel>
                  <input 
                    name="unit_no" 
                    className={inputCls + " border-[#d4ad4d]/40 font-bold bg-[#fafaf8]"} 
                    placeholder="e.g. Cypress-401, Floor 9, B-G 01" 
                    defaultValue={initialValues.unit_no ?? ''} 
                  />
                  <p className="text-[9px] text-zinc-400 italic">🔒 Private field. Never shared with clients on WhatsApp.</p>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Agreed Brokerage Terms (Private)</FieldLabel>
                  <input 
                    name="brokerage" 
                    className={inputCls + " border-[#d4ad4d]/40 font-bold bg-[#fafaf8]"} 
                    placeholder="e.g. 1% or 2% + GST" 
                    defaultValue={initialValues.brokerage ?? ''} 
                  />
                  <p className="text-[9px] text-zinc-400 italic">🔒 Private field. Kept strictly within internal ERP.</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <FieldLabel>Internal Notes</FieldLabel>
                <textarea
                  name="internal_notes"
                  className={textareaCls}
                  rows={3}
                  placeholder="Private notes, key location, owner negotiation notes..."
                  defaultValue={initialValues.internal_notes ?? ''}
                />
              </div>
            </div>
          )}

          {/* ── SECTION 4: Media ── */}
          {activeSection === 4 && (
            <div className="space-y-5">
              <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.15em] mb-4">Property Images</div>
              <MediaPicker bucket="property-images" fieldPrefix="image_" />
              <p className="text-[9.5px] text-zinc-400">Upload high-quality images to showcase this listing. JPG, PNG, WEBP · Max 10 MB per file.</p>
            </div>
          )}

          {/* Bottom navigation */}
          <div className="mt-10 flex items-center justify-between pt-5 border-t border-[#ebebeb]">
            {activeSection > 0 ? (
              <button
                type="button"
                onClick={() => setActiveSection(s => s - 1)}
                className="text-[11px] font-bold text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors"
              >
                ← {SECTIONS[activeSection - 1].label}
              </button>
            ) : <span />}
            {activeSection < SECTIONS.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveSection(s => s + 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#e8e7e4] bg-white text-zinc-700 text-[11px] font-bold hover:bg-zinc-50 transition-all"
              >
                {SECTIONS[activeSection + 1].label} →
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#d4ad4d] text-white text-[11px] font-bold hover:bg-[#b8922e] transition-all shadow-[0_2px_8px_rgba(212,173,77,.35)]"
              >
                {isEdit ? 'Update Property' : 'Save Property'}
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
