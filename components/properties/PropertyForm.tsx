"use client";
import { useActionState } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createPropertyAction, updatePropertyAction } from '@/app/properties/actions';
import { supabase } from '@/lib/supabaseClient';
import { TagsInput } from '@/components/ui/tags-input';
import { MediaPicker } from '@/components/ui/media-picker';
import { IndianNumberInput } from '@/components/ui/indian-number-input';
import { Building2, MapPin, User, ImageIcon, DollarSign, Trash2, ChevronLeft, ChevronDown, Loader2, Plus, X } from 'lucide-react';
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

const inputCls = "w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base lg:text-[12px] font-medium text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all";
const selectCls = "w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base lg:text-[12px] font-medium text-zinc-800 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all appearance-none cursor-pointer";
const labelCls = "text-[10px] font-bold text-zinc-400 uppercase tracking-widest";
const textareaCls = "w-full px-3.5 py-2.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base lg:text-[12px] font-medium text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all resize-none";

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

// property_code has a unique constraint in the DB. Leaving the field blank used to submit
// an empty string (not null), and Postgres treats duplicate empty strings as a unique-key
// collision -- so the second property ever saved with a blank code failed. Generating a
// fresh, effectively-collision-proof code per form load removes the need to ever leave it
// blank; staff can still overwrite it with their own scheme if they want.
function generatePropertyCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PRP-${timestamp}-${random}`;
}

export function PropertyForm({ initialValues = {}, mode = 'create' }: PropertyFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit' && !!initialValues.id;
  const [state, formAction, isPending] = useActionState(isEdit ? updatePropertyAction : createPropertyAction, null);
  const [deleting, setDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [images, setImages] = useState<any[]>([]);

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

  useEffect(() => {
    if (initialValues.id) {
      supabase.from('property_images')
        .select('*')
        .eq('property_id', initialValues.id)
        .order('sort_order', { ascending: true })
        .then(async ({ data }) => {
          if (data) {
            const mapped = await Promise.all(data.map(async img => {
              if (img.url.startsWith('http')) return { ...img, previewUrl: img.url };
              const { data: sData } = await supabase.storage.from('property-images').createSignedUrl(img.url, 604800);
              return { ...img, previewUrl: sData?.signedUrl || img.url };
            }));
            setImages(mapped);
          }
        });
    }
  }, [initialValues.id]);

  const handleImagesUploaded = async (newPaths: string[]) => {
    const newImgs = await Promise.all(newPaths.map(async path => {
      const { data: sData } = await supabase.storage.from('property-images').createSignedUrl(path, 604800);
      return {
        url: path,
        previewUrl: sData?.signedUrl || path
      };
    }));
    setImages(prev => [...prev, ...newImgs]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const [configuration, setConfiguration] = useState<string[]>(
    initialValues.configuration ? initialValues.configuration.split(',').map((s: string) => s.trim()) : []
  );
  const [locations, setLocations] = useState<string[]>(
    initialValues.location
      ? initialValues.location.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []
  );
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([]);

  // Auto-generate a code for new properties so the field is never submitted blank.
  // Editing an existing property (even one that currently has no code) keeps whatever
  // is already there rather than forcing a code onto it.
  const [propertyCode, setPropertyCode] = useState(
    initialValues.property_code || (initialValues.id ? '' : generatePropertyCode())
  );

  // Live preview state
  const [previewTitle, setPreviewTitle] = useState(initialValues.title || '');
  const [previewPrice, setPreviewPrice] = useState(initialValues.price || '');
  const [previewType, setPreviewType] = useState(initialValues.property_type || '');
  const [alternateOwnerContacts, setAlternateOwnerContacts] = useState<string[]>(
    Array.isArray(initialValues.alternate_owner_contacts) ? initialValues.alternate_owner_contacts : []
  );

  useEffect(() => {
    supabase.from('locations').select('name').order('name').then(({ data }) => {
      if (data) setLocationOptions(data.map(l => ({ value: l.name, label: l.name })));
    });
  }, []);

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? 'Property updated successfully' : 'Property saved successfully');
      if (locations.length > 0) {
        locations.forEach(loc => {
          supabase.from('locations').upsert({ name: loc }, { onConflict: 'name' });
        });
      }
      router.push('/properties');
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
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

  // Required fields are validated here rather than via the native `required` attribute:
  // whichever wizard section isn't currently active is display:none, and a hidden required
  // field can't be focused by the browser to show its validation error -- it just silently
  // blocks submission instead. This runs on submit, jumps to the offending section, and
  // shows a toast so the failure is actually visible.
  function validateRequiredFields(): boolean {
    if (!previewTitle.trim()) {
      toast.error('Property Title is required.');
      setActiveSection(0);
      return false;
    }
    if (locations.length === 0) {
      toast.error('At least one location is required.');
      setActiveSection(1);
      return false;
    }
    if (!previewPrice || !String(previewPrice).trim()) {
      toast.error('Price is required.');
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

  // ── Render Helpers for Property Form Sections ──

  const renderBasicInfo = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <FieldLabel required>Society Name</FieldLabel>
          <input
            name="title"
            className={inputCls}
            placeholder="e.g. Modern Luxury Villa"
            defaultValue={initialValues.title ?? ''}
            onChange={e => setPreviewTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Property Code</FieldLabel>
          <input name="property_code" className={inputCls} placeholder="PRP-001" value={propertyCode} onChange={e => setPropertyCode(e.target.value)} />
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
              <option>Villa / Independent House</option>
              <option>Office Space</option>
              <option>Shop / Retail</option>
              <option>Plot / Land</option>
            </select>
          </SelectWrapper>
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Configuration</FieldLabel>
          <TagsInput
            value={configuration}
            onChange={setConfiguration}
            options={[
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
            ]}
            allowCustom={true}
            placeholder="Add config..."
          />
          <input type="hidden" name="configuration" value={configuration.join(', ')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Description</FieldLabel>
        <textarea
          name="description"
          className={textareaCls}
          rows={3}
          placeholder="Public property description copy..."
          defaultValue={initialValues.description ?? ''}
        />
      </div>
    </div>
  );

  const renderLocation = () => (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <FieldLabel required>Location Tags</FieldLabel>
        <TagsInput
          value={locations}
          onChange={setLocations}
          options={locationOptions}
          allowCustom={true}
          placeholder="e.g. Kalyani Nagar, Viman Nagar"
        />
        <input type="hidden" name="location" value={locations.join(', ')} />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Address</FieldLabel>
        <textarea
          name="address"
          className={textareaCls}
          rows={3}
          placeholder="Full property address details..."
          defaultValue={initialValues.address ?? ''}
        />
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <FieldLabel required>Price (₹)</FieldLabel>
          <IndianNumberInput
            name="price"
            className={inputCls}
            placeholder="e.g. 1,50,00,000"
            defaultValue={initialValues.price ?? ''}
            onValueChange={setPreviewPrice}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Listing Type</FieldLabel>
          <SelectWrapper>
            <select name="listing_type" className={selectCls} defaultValue={initialValues.listing_type ?? 'Sale'}>
              <option>Sale</option>
              <option>Rent</option>
            </select>
          </SelectWrapper>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <FieldLabel>Carpet Area (sq ft)</FieldLabel>
          <input type="number" name="carpet_area" className={inputCls} placeholder="e.g. 1200" defaultValue={initialValues.carpet_area ?? ''} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Built Up Area (sq ft)</FieldLabel>
          <input type="number" name="built_up_area" className={inputCls} placeholder="e.g. 1500" defaultValue={initialValues.built_up_area ?? ''} />
        </div>
      </div>
    </div>
  );

  const renderOwnership = () => (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <FieldLabel>Property Source</FieldLabel>
        <SelectWrapper>
          <select name="source_type" className={selectCls} defaultValue={initialValues.source_type ?? 'Direct'}>
            <option value="Direct">Direct</option>
            <option value="Broker">Broker</option>
          </select>
        </SelectWrapper>
      </div>

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

      <div className="space-y-1.5">
        <FieldLabel>Additional Mobile Numbers</FieldLabel>
        <div className="space-y-2">
          {alternateOwnerContacts.map((num, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                name="alternate_owner_contacts"
                value={num}
                onChange={e => setAlternateOwnerContacts(prev => prev.map((p, i) => i === idx ? e.target.value : p))}
                className={inputCls}
                placeholder="+91 90000 00001"
              />
              <button
                type="button"
                onClick={() => setAlternateOwnerContacts(prev => prev.filter((_, i) => i !== idx))}
                className="shrink-0 p-2 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setAlternateOwnerContacts(prev => [...prev, ''])}
            className="flex items-center gap-1 text-[11px] font-bold text-[#b8922e] hover:text-[#96751f] transition-colors"
          >
            <Plus className="h-3 w-3" /> Add another number
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <FieldLabel>Apartment / Unit No (Private)</FieldLabel>
          <input 
            name="unit_no" 
            className={inputCls + " border-[#d4ad4d]/40 font-bold bg-[#fafaf8]"} 
            placeholder="e.g. Cypress-401, Floor 9" 
            defaultValue={initialValues.unit_no ?? ''} 
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Agreed Brokerage Terms (Private)</FieldLabel>
          <input 
            name="brokerage" 
            className={inputCls + " border-[#d4ad4d]/40 font-bold bg-[#fafaf8]"} 
            placeholder="e.g. 1% or 2%" 
            defaultValue={initialValues.brokerage ?? ''} 
          />
        </div>
      </div>

      <div className="space-y-1.5 pt-2">
        <FieldLabel>Internal Notes</FieldLabel>
        <textarea
          name="internal_notes"
          className={textareaCls}
          rows={3}
          placeholder="Private notes..."
          defaultValue={initialValues.internal_notes ?? ''}
        />
      </div>
    </div>
  );

  const renderMedia = () => (
    <div className="space-y-5 text-left">
      <div className="space-y-1.5">
        <FieldLabel>Property Images & Videos</FieldLabel>
        <MediaPicker 
          bucket="property-images" 
          fieldPrefix={`prop-${initialValues.id || 'new'}_`} 
          onUploadComplete={handleImagesUploaded}
        />
      </div>

      {images.length > 0 && (
        <div className="space-y-2 pt-2">
          <FieldLabel>Uploaded Media ({images.length})</FieldLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                <img 
                  src={img.previewUrl} 
                  alt="Property media" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1.5 right-1.5 bg-white/95 text-rose-600 hover:text-rose-700 p-1 rounded-md shadow-sm border border-zinc-100 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Hidden inputs to pass paths to Server Action */}
      {images.map((img, idx) => (
        <input key={idx} type="hidden" name="image_urls" value={img.url} />
      ))}
    </div>
  );


  return (
    <form action={formAction} onSubmit={handleSubmit} className="min-h-screen bg-[#fafaf8]">
      {isEdit && <input type="hidden" name="id" value={initialValues.id} />}

      {/* Sticky top header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#ebebeb] px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between gap-3 shadow-[0_1px_0_0_#ebebeb]">
        <Link href="/properties" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 transition-colors shrink-0">
          <ChevronLeft className="h-4 w-4" />
          <span className="text-xs font-semibold hidden sm:block">Back to Properties</span>
        </Link>
        <h1 className="text-[15px] font-extrabold text-zinc-900 flex-1 text-center lg:text-left" style={{ letterSpacing: '-0.3px' }}>
          {isEdit ? 'Edit Property' : 'New Property'}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || isPending}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-600 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 transition-all disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#d4ad4d] text-white text-[11px] font-bold hover:bg-[#b8922e] transition-all shadow-[0_2px_8px_rgba(212,173,77,.35)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isPending ? 'Saving…' : (isEdit ? 'Update Property' : 'Save Property')}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {state?.error && (
        <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-[11px] font-bold">
          Error: {state.error}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Only one of these layouts is ever mounted (see isDesktop above) -- previously
            both were always mounted with CSS show/hide, duplicating every field's name
            attribute in this <form> and breaking both validation and submitted values. */}
        {isDesktop ? (
        /* ── DESKTOP VIEWPORT: Split Panel Nav Wizard ── */
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
          {/* Sections stay mounted (display:none when inactive) rather than unmounting,
              so fields from earlier sections are still present in FormData when submitting
              from a later section — otherwise saving from the last page would silently
              drop required fields like title/price and fail. */}
          <div className="flex-1 px-8 py-6 max-w-2xl">
            <div style={{ display: activeSection === 0 ? 'block' : 'none' }}>{renderBasicInfo()}</div>
            <div style={{ display: activeSection === 1 ? 'block' : 'none' }}>{renderLocation()}</div>
            <div style={{ display: activeSection === 2 ? 'block' : 'none' }}>{renderPricing()}</div>
            <div style={{ display: activeSection === 3 ? 'block' : 'none' }}>{renderOwnership()}</div>
            <div style={{ display: activeSection === 4 ? 'block' : 'none' }}>{renderMedia()}</div>

            {/* Bottom navigation bar */}
            <div className="mt-8 flex items-center justify-between pt-4 border-t border-[#ebebeb]">
              {activeSection > 0 ? (
                <button type="button" onClick={() => setActiveSection(s => s - 1)}
                  className="text-[11px] font-bold text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors">
                  ← {SECTIONS[activeSection - 1].label}
                </button>
              ) : <span />}
              {activeSection < SECTIONS.length - 1 ? (
                <button type="button" onClick={() => setActiveSection(s => s + 1)}
                  className="dc-btn font-bold text-[11px] flex items-center gap-1">
                  {SECTIONS[activeSection + 1].label} →
                </button>
              ) : (
                <button type="submit" disabled={isPending} className="dc-btn gold font-bold flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isPending ? 'Saving…' : 'Save Property'}
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
              <span>Basic Information</span>
            </h3>
            {renderBasicInfo()}
          </div>

          <div className="px-5 pt-6 pb-5 border-b border-zinc-100 space-y-4">
            <h3 className="text-[11px] font-black text-zinc-900 pb-2.5 uppercase tracking-wider flex items-baseline gap-2 border-b border-zinc-100">
              <span className="font-serif italic font-bold text-[#d4ad4d] text-sm">02.</span>
              <span>Location Details</span>
            </h3>
            {renderLocation()}
          </div>

          <div className="px-5 pt-6 pb-5 border-b border-zinc-100 space-y-4">
            <h3 className="text-[11px] font-black text-zinc-900 pb-2.5 uppercase tracking-wider flex items-baseline gap-2 border-b border-zinc-100">
              <span className="font-serif italic font-bold text-[#d4ad4d] text-sm">03.</span>
              <span>Pricing & Carpet Area</span>
            </h3>
            {renderPricing()}
          </div>

          <div className="px-5 pt-6 pb-5 border-b border-zinc-100 space-y-4">
            <h3 className="text-[11px] font-black text-zinc-900 pb-2.5 uppercase tracking-wider flex items-baseline gap-2 border-b border-zinc-100">
              <span className="font-serif italic font-bold text-[#d4ad4d] text-sm">04.</span>
              <span>Ownership & Private Terms</span>
            </h3>
            {renderOwnership()}
          </div>

          <div className="px-5 pt-6 pb-8 space-y-4">
            <h3 className="text-[11px] font-black text-zinc-900 pb-2.5 uppercase tracking-wider flex items-baseline gap-2 border-b border-zinc-100">
              <span className="font-serif italic font-bold text-[#d4ad4d] text-sm">05.</span>
              <span>Media Uploads</span>
            </h3>
            {renderMedia()}
          </div>
        </div>
        )}

      </div>
    </form>
  );
}
