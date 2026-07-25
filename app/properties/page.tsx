"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useProfile } from '@/lib/auth';
import { fetchProperties, Property } from '@/lib/queries';
import { supabase } from '@/lib/supabaseClient';
import { getPermissions } from '@/lib/permissions';
import { 
  Home, 
  Search, 
  Plus, 
  MapPin, 
  X,
  Phone,
  User,
  CheckCircle,
  FileText,
  SlidersHorizontal,
  Share2,
  Copy,
  MessageSquare,
  Mail,
  ChevronDown,
  Image as ImageIcon,
  DollarSign,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatPriceShort } from '@/lib/formatters';
import { ImageSlider } from '@/components/ui/image-slider';
import { AvatarCell } from '@/components/ui/AvatarCell';
import { InlineStatsBar } from '@/components/ui/InlineStatsBar';

export default function PropertyInventoryPage() {
  const profile = useProfile();
  const perms = getPermissions(profile?.role);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [activeState, setActiveState] = useState<'Active' | 'Inactive' | 'All'>('Active');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [drawerImages, setDrawerImages] = useState<string[]>([]);
  const [drawerImagesLoading, setDrawerImagesLoading] = useState(false);

  // Selection for bulk send
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Drill-down advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterLocations, setFilterLocations] = useState<string[]>([]);
  const [filterPropertyType, setFilterPropertyType] = useState('');
  const [filterConfiguration, setFilterConfiguration] = useState('');
  const [filterListingType, setFilterListingType] = useState('');
  const [filterSourceType, setFilterSourceType] = useState(''); // '' = All, 'Direct' = direct, 'Broker' = through broker
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterAreaMin, setFilterAreaMin] = useState('');
  const [filterAreaMax, setFilterAreaMax] = useState('');
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  // Fetch available locations
  useEffect(() => {
    supabase.from('locations').select('name').order('name').then(({ data }) => {
      if (data) setAvailableLocations(data.map(l => l.name));
    });
  }, [properties]); // Re-fetch when properties change (new property added may have new location)

  // Fetch properties on load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProperties(profile)
        .then(data => {
          setProperties(data || []);
        })
        .catch((err) => {
          console.error(err);
          setProperties([]);
        })
        .finally(() => setLoading(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [profile]);

  const displayProperties = properties;

  const inlineStats = useMemo(() => {
    let total = displayProperties.length;
    let available = 0;
    let underOffer = 0;
    let valuation = 0;
    
    displayProperties.forEach(p => {
      if (p.status_id === 'Available') {
        available++;
        valuation += p.price || 0;
      } else if (p.status_id === 'Under Offer') {
        underOffer++;
      }
    });

    return [
      { label: 'Total Listings', count: total, colorClass: 'bg-zinc-400' },
      { label: 'Available Inventory', count: available, colorClass: 'bg-emerald-500' },
      { label: 'Under Offer', count: underOffer, colorClass: 'bg-amber-500' },
      { label: 'Available Valuation', count: formatPriceShort(valuation), colorClass: 'bg-zinc-600' }
    ];
  }, [displayProperties]);

  // Filter and search logic
  const filteredProperties = useMemo(() => {
    return displayProperties.filter(prop => {
      const matchesSearch = 
        (prop.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prop.property_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prop.location || '').toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesTab = activeTab === 'All' || prop.status_id === activeTab;

      // Active/Inactive filter
      const matchesActiveState = activeState === 'All' 
        || (activeState === 'Active' && prop.is_active !== false)
        || (activeState === 'Inactive' && prop.is_active === false);

      const matchesLocation = filterLocations.length === 0 || filterLocations.some(loc => 
        (prop.location || '').toLowerCase().includes(loc.toLowerCase())
      );
      const matchesPropertyType = !filterPropertyType || prop.property_type === filterPropertyType;
      const matchesConfiguration = !filterConfiguration || (prop.configuration || '').includes(filterConfiguration);
      const matchesListingType = !filterListingType || prop.listing_type === filterListingType;
      // No source-type (Direct/Broker) field exists on Property yet — filter is a no-op until that data lands.
      const matchesSourceType = true;

      let matchesPrice = true;
      if (filterPriceMin) {
        const min = parseFloat(filterPriceMin);
        if (!isNaN(min)) matchesPrice = (prop.price || 0) >= min;
      }
      if (matchesPrice && filterPriceMax) {
        const max = parseFloat(filterPriceMax);
        if (!isNaN(max)) matchesPrice = (prop.price || 0) <= max;
      }

      let matchesArea = true;
      if (filterAreaMin) {
        const min = parseFloat(filterAreaMin);
        if (!isNaN(min)) matchesArea = (prop.carpet_area || 0) >= min;
      }
      if (matchesArea && filterAreaMax) {
        const max = parseFloat(filterAreaMax);
        if (!isNaN(max)) matchesArea = (prop.carpet_area || 0) <= max;
      }

      return matchesSearch && matchesTab && matchesActiveState && matchesLocation && matchesPropertyType && matchesConfiguration && matchesListingType && matchesSourceType && matchesPrice && matchesArea;
    });
  }, [displayProperties, searchQuery, activeTab, activeState, filterLocations, filterPropertyType, filterConfiguration, filterListingType, filterSourceType, filterPriceMin, filterPriceMax, filterAreaMin, filterAreaMax]);

  // Selection helpers
  const allVisibleSelected = filteredProperties.length > 0 && filteredProperties.every(p => selectedIds.has(p.id));
  const someVisibleSelected = filteredProperties.some(p => selectedIds.has(p.id));

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) filteredProperties.forEach(p => next.add(p.id));
      else filteredProperties.forEach(p => next.delete(p.id));
      return next;
    });
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // Clean plain text share (no emojis) — suitable for WhatsApp and clipboard
  const getPropertyText = (prop: Property) => {
    // Strip (null) or internal codes from title
    const cleanTitle = (prop.title || '').replace(/\s*\(\s*null\s*\)/gi, '').trim();
    const priceStr = prop.price ? formatPriceShort(prop.price) : 'Price on request';

    let text = `${cleanTitle}\nLocation: ${prop.location || 'Pune'}\nPrice: ${priceStr}\nType: ${prop.configuration || prop.property_type || 'Apartment'}\nArea: ${prop.carpet_area ? `${prop.carpet_area} sq ft` : 'N/A'}\nFor: ${prop.listing_type || 'Sale'}`;

    if ((prop as any).parking_spaces) {
      text += `\nParking: ${(prop as any).parking_spaces} Car park(s)`;
    }
    if ((prop as any).facing) {
      text += `\nFacing: ${(prop as any).facing}`;
    }
    if ((prop as any).furnishing) {
      text += `\nFurnishing: ${(prop as any).furnishing}`;
    }
    if (prop.description) {
      // Strip any accidental unit no or brokerage text from description if present
      const cleanDesc = prop.description
        .replace(/Agreed Brokerage:[^\n]*/gi, '')
        .replace(/Cypress-\d+/gi, '')
        .replace(/B-G \d+/gi, '')
        .trim();
      if (cleanDesc) text += `\n\n${cleanDesc}`;
    }

    return text;
  };

  const getSelectedProperties = () => {
    return displayProperties.filter(p => selectedIds.has(p.id));
  };

  const handleShareWhatsApp = (props?: Property[]) => {
    const items = props || getSelectedProperties();
    if (items.length === 0) return;
    const header = items.length > 1 ? `LUXE REALTY PUNE - ${items.length} PROPERTIES\n${'─'.repeat(30)}\n\n` : `LUXE REALTY PUNE\n\n`;
    const text = header + items.map((p, i) => items.length > 1 ? `${i + 1}. ${getPropertyText(p)}` : getPropertyText(p)).join('\n\n---\n\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = (props?: Property[]) => {
    const items = props || getSelectedProperties();
    if (items.length === 0) return;
    const subject = items.length === 1 
      ? `Property: ${items[0].title} (${items[0].property_code})`
      : `${items.length} Property Listings from Luxe Realty`;
    const body = items.map(p => getPropertyText(p).replace(/\*/g, '')).join('\n\n---\n\n');
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handleCopyDetails = (props?: Property[]) => {
    const items = props || getSelectedProperties();
    if (items.length === 0) return;
    const text = items.map(p => getPropertyText(p).replace(/\*/g, '')).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
  };

  const handleDeleteProperty = async (id: string) => {
    if (!perms.canDeleteProperties) return;
    if (!confirm('Are you sure you want to permanently delete this property listing?')) return;
    setProperties(prev => prev.filter(p => p.id !== id));
    if (selectedProperty?.id === id) {
      setIsDrawerOpen(false);
      setSelectedProperty(null);
    }
    try {
      await supabase.from('properties').delete().eq('id', id);
    } catch (err) {
      console.error('Error deleting property:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (!perms.canDeleteProperties || selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.size} selected properties?`)) return;
    const idsToDelete = Array.from(selectedIds);
    setProperties(prev => prev.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    try {
      await supabase.from('properties').delete().in('id', idsToDelete);
    } catch (err) {
      console.error('Error bulk deleting properties:', err);
    }
  };

  // Handle open property drawer with images
  const handleOpenProperty = async (prop: Property) => {
    setSelectedProperty(prop);
    setNoteText(prop.internal_notes || '');
    setIsDrawerOpen(true);
    setDrawerImages([]);
    setDrawerImagesLoading(true);

    try {
      const { data } = await supabase
        .from('property_images')
        .select('url')
        .eq('property_id', prop.id)
        .order('sort_order', { ascending: true });
      if (data && data.length > 0) {
        const signedUrls = await Promise.all(
          data.map(async (img) => {
            if (img.url.startsWith('http')) return img.url;
            const { data: sData } = await supabase.storage
              .from('property-images')
              .createSignedUrl(img.url, 604800); // 7 days expiry
            return sData?.signedUrl || img.url;
          })
        );
        setDrawerImages(signedUrls);
      }
    } catch (err) {
      console.error('Error loading images:', err);
    } finally {
      setDrawerImagesLoading(false);
    }
  };


  // Status color helper
  const getStatusStyle = (status: string | undefined) => {
    switch (status) {
      case 'Available': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Under Offer': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Sold': return 'bg-zinc-100 text-zinc-600 border-zinc-200';
      default: return 'bg-zinc-50 text-zinc-600 border-zinc-200';
    }
  };

  // Toggle active/inactive state
  const handleToggleActive = async (propId: string, currentState: boolean) => {
    const newState = !currentState;
    // Optimistic update
    setProperties(prev => prev.map(p => p.id === propId ? { ...p, is_active: newState } : p));
    try {
      await supabase.from('properties').update({ is_active: newState }).eq('id', propId);
    } catch (err) {
      // Revert on error
      setProperties(prev => prev.map(p => p.id === propId ? { ...p, is_active: currentState } : p));
      console.error('Error toggling active state:', err);
    }
  };

  // Inline status change — auto-deactivate when Sold
  const handleInlineStatusChange = async (propId: string, newStatusId: string) => {
    const updateData: Record<string, unknown> = { status_id: newStatusId };
    if (newStatusId === 'Sold') updateData.is_active = false;
    setProperties(prev => prev.map(p => p.id === propId ? { ...p, status_id: newStatusId, ...(newStatusId === 'Sold' ? { is_active: false } : {}) } : p));
    try {
      await supabase.from('properties').update(updateData).eq('id', propId);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="w-full pb-20 text-zinc-900 text-left">
      {/* Unified Direction C Frame */}
      <div className="overflow-hidden bg-white border border-[#e8e7e4] rounded-2xl shadow-sm">

        {/* Editorial Header — inside the card */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 px-6 py-5 border-b border-[#ebebeb]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-extrabold tracking-tight text-zinc-900" style={{ letterSpacing: '-0.4px' }}>Property Inventory</h1>
              <span className="bg-zinc-900 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                {filteredProperties.length}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Real-time inventory database · Luxe Realty Pune</p>
          </div>
          {/* Header actions: Share selection + New Property */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedIds.size > 0 && (
              <button
                onClick={() => handleShareWhatsApp(filteredProperties.filter(p => selectedIds.has(p.id)))}
                className="dc-btn font-semibold flex items-center gap-1.5 text-emerald-700 border-emerald-200 bg-emerald-50"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Send {selectedIds.size} via WhatsApp
              </button>
            )}
            <Link href="/properties/create">
              <button className="dc-btn gold font-bold flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                New Property
              </button>
            </Link>
          </div>
        </div>

        {/* Inline Stats Bar — glued directly under header */}
        <InlineStatsBar stats={inlineStats} />

        {/* Porcelain Unified Toolbar */}
        <div className="dc-toolbar">
          {/* Search Input */}
          <div className="dc-search-container">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search properties, codes, locations..." 
              className="dc-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Tab Dropdown Filter */}
          <select
            aria-label="Filter by tab status"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="dc-btn font-semibold cursor-pointer"
          >
            <option value="All">All statuses</option>
            <option value="Available">Available</option>
            <option value="Under Offer">Under Offer</option>
            <option value="Sold">Sold</option>
          </select>

          {/* Drill Down Toggle */}
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`dc-btn font-bold cursor-pointer ${
              showAdvancedFilters ? 'bg-zinc-900! text-white! border-zinc-900!' : ''
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Drill Down
            {(filterLocations.length > 0 || filterPropertyType || filterConfiguration || filterListingType || filterPriceMin || filterPriceMax || filterAreaMin || filterAreaMax) && (
              <span className="ml-1 h-4 w-4 rounded-full bg-zinc-700 text-white text-[9px] font-bold flex items-center justify-center">
                {[filterLocations.length > 0, filterPropertyType, filterConfiguration, filterListingType, filterPriceMin || filterPriceMax, filterAreaMin || filterAreaMax].filter(Boolean).length}
              </span>
            )}
          </button>

          <div className="dc-divider"></div>

          {/* Active/Inactive Segment Control */}
          <div className="dc-seg">
            {(['Active', 'Inactive', 'All'] as const).map((state) => (
              <button
                key={state}
                onClick={() => setActiveState(state)}
                className={`dc-seg-btn ${activeState === state ? 'on' : ''}`}
              >
                {state}
              </button>
            ))}
          </div>

          <div className="dc-divider"></div>

          {/* Direct / Broker Source Filter */}
          <div className="dc-seg">
            {([{ key: '', label: 'All' }, { key: 'Direct', label: 'Direct' }, { key: 'Broker', label: 'Broker' }]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterSourceType(key)}
                className={`dc-seg-btn ${filterSourceType === key ? 'on' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Drill Down Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="border-b border-[#e8e7e4] bg-[#fcfcfa] px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />
                Drill Down Filters
              </h3>
              <button
                onClick={() => {
                  setFilterLocations([]);
                  setFilterPropertyType('');
                  setFilterConfiguration('');
                  setFilterListingType('');
                  setFilterPriceMin('');
                  setFilterPriceMax('');
                  setFilterAreaMin('');
                  setFilterAreaMax('');
                }}
                className="text-[10px] font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                Clear all filters
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Location</label>
                <button
                  type="button"
                  onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                  className="w-full flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold text-left outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                >
                  {filterLocations.length === 0 
                    ? <span className="text-zinc-400">All locations</span>
                    : <span className="text-zinc-800">{filterLocations.length} selected</span>
                  }
                  <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${locationDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {filterLocations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {filterLocations.map(loc => (
                      <span key={loc} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-100 text-[9px] font-bold text-zinc-700">
                        {loc}
                        <button onClick={() => setFilterLocations(prev => prev.filter(l => l !== loc))} className="text-zinc-400 hover:text-zinc-700">×</button>
                      </span>
                    ))}
                  </div>
                )}
                {locationDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setLocationDropdownOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-56 max-h-52 overflow-y-auto bg-white border border-zinc-200 rounded-xl shadow-lg z-40 p-1">
                      {availableLocations.map(loc => (
                        <button
                          key={loc}
                          onClick={() => {
                            setFilterLocations(prev => 
                              prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
                            );
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            filterLocations.includes(loc) ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-650 hover:bg-zinc-50'
                          }`}
                        >
                          {loc}
                          {filterLocations.includes(loc) && <span className="text-emerald-500 font-bold">✓</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Property Type</label>
                <select
                  value={filterPropertyType}
                  onChange={(e) => setFilterPropertyType(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                >
                  <option value="">All types</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Row House">Row House</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Plot">Plot</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Configuration</label>
                <select
                  value={filterConfiguration}
                  onChange={(e) => setFilterConfiguration(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                >
                  <option value="">Any config</option>
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                  <option value="5 BHK">5 BHK</option>
                  <option value="5+ BHK">5+ BHK</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Listing Type</label>
                <select
                  value={filterListingType}
                  onChange={(e) => setFilterListingType(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                >
                  <option value="">All</option>
                  <option value="Sale">For Sale</option>
                  <option value="Rent">For Rent</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Price Min (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 10000000"
                  value={filterPriceMin}
                  onChange={(e) => setFilterPriceMin(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Price Max (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000000"
                  value={filterPriceMax}
                  onChange={(e) => setFilterPriceMax(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Area Min (sqft)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={filterAreaMin}
                  onChange={(e) => setFilterAreaMin(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Area Max (sqft)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={filterAreaMax}
                  onChange={(e) => setFilterAreaMax(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notion Style Table Container */}
        <div className="dc-table-container">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-14 bg-zinc-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="dc-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }} className="text-center">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(el) => { if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected; }}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500/20 cursor-pointer"
                    />
                  </th>
                  <th>Property Details</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Config</th>
                  <th>Area</th>
                  <th className="text-right">Price</th>
                  <th>Listing</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={perms.canDeleteProperties ? 13 : 12} className="px-4 py-12 text-center text-xs font-semibold text-zinc-400">
                      <Home className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                      No properties match your filters
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((prop) => (
                    <tr 
                      key={prop.id}
                      className="cursor-pointer group"
                    >
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(prop.id)}
                          onChange={(e) => toggleSelect(prop.id, e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500/20 cursor-pointer"
                        />
                      </td>
                      <td onClick={() => handleOpenProperty(prop)}>
                        <AvatarCell 
                          name={prop.title || 'No Title'} 
                          subtext={prop.property_code || '—'} 
                        />
                      </td>
                      <td onClick={() => handleOpenProperty(prop)}>
                        <span className="text-xs text-zinc-600 flex items-center gap-1 font-semibold">
                          <MapPin className="h-3 w-3 text-zinc-400" />
                          {prop.location}
                        </span>
                      </td>
                      <td onClick={() => handleOpenProperty(prop)}>
                        <span className="text-xs font-semibold text-zinc-700">{prop.property_type}</span>
                      </td>
                      <td onClick={() => handleOpenProperty(prop)}>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] font-bold text-zinc-700 uppercase">
                          {prop.configuration || '—'}
                        </span>
                      </td>
                      <td onClick={() => handleOpenProperty(prop)}>
                        <span className="text-xs font-semibold text-zinc-700">{prop.carpet_area ? `${prop.carpet_area} sqft` : '—'}</span>
                      </td>
                      <td className="text-right font-bold text-zinc-900 text-xs" onClick={() => handleOpenProperty(prop)}>
                        {formatPriceShort(prop.price)}
                      </td>
                      <td onClick={() => handleOpenProperty(prop)}>
                        <span className={`dc-badge ${
                          prop.listing_type === 'Sale' 
                            ? 'border-blue-100 bg-blue-50 text-blue-700' 
                            : 'border-purple-100 bg-purple-50 text-purple-700'
                        }`}>
                          {prop.listing_type}
                        </span>
                      </td>
                      <td onClick={() => handleOpenProperty(prop)}>
                        <span className={`dc-badge ${getStatusStyle(prop.status_id)}`}>
                          {prop.status_id || 'Available'}
                        </span>
                      </td>
                      <td onClick={() => handleOpenProperty(prop)}>
                        <span className="text-xs text-zinc-600 font-semibold truncate max-w-[100px] block">{prop.owner_name || '—'}</span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenProperty(prop)}
                            className="text-[10.5px] font-bold text-[#d4ad4d] hover:text-[#b8922e] transition-colors whitespace-nowrap"
                          >
                            View →
                          </button>
                          <button
                            onClick={() => handleShareWhatsApp([prop])}
                            className="p-1 rounded text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Send via WhatsApp"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                          {perms.canDeleteProperties && (
                            <button
                              onClick={() => handleDeleteProperty(prop.id)}
                              className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Footer count */}
          {!loading && (
            <div className="px-5 py-3 border-t border-zinc-100 bg-[#fafaf8] text-[11px] font-bold text-zinc-400">
              Showing {filteredProperties.length} of {displayProperties.length} properties
            </div>
          )}
        </div>
      </div>

      {/* Property Details Drawer */}
      {isDrawerOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-[420px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

            {/* Gold band — Direction C signature */}
            <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg, #d4ad4d, #e8c96e, #d4ad4d)' }} />

            {/* Hero identity block */}
            <div className="px-5 py-4 border-b border-[#ebebeb] shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center text-[12px] font-extrabold shrink-0 mt-0.5">
                    {selectedProperty.property_type?.slice(0, 2).toUpperCase() || 'PR'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
                        {selectedProperty.property_code || 'No Code'}
                      </span>
                    </div>
                    <h2 className="text-[14px] font-extrabold text-zinc-900 leading-tight" style={{ letterSpacing: '-0.3px' }}>
                      {selectedProperty.title}
                    </h2>
                    <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {selectedProperty.location || 'No location'}
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors shrink-0">
                  <X className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
              {/* Status badges */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${getStatusStyle(selectedProperty.status_id || 'Available')}`}>
                  {selectedProperty.status_id || 'Available'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                  selectedProperty.listing_type === 'Sale'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {selectedProperty.listing_type || 'Sale'}
                </span>
                <span className="text-[11px] font-extrabold text-[#d4ad4d] ml-auto">
                  {formatPriceShort(selectedProperty.price)}
                </span>
              </div>
            </div>

            {/* Quick action bar */}
            <div className="grid grid-cols-4 border-b border-[#ebebeb] shrink-0">
              <button
                onClick={() => handleShareWhatsApp([selectedProperty])}
                className="flex flex-col items-center gap-1 py-3 text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-[9px] font-bold">WhatsApp</span>
              </button>
              <button
                onClick={() => handleCopyDetails([selectedProperty])}
                className="flex flex-col items-center gap-1 py-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                <Copy className="h-4 w-4" />
                <span className="text-[9px] font-bold">Copy</span>
              </button>
              {selectedProperty.owner_contact ? (
                <a
                  href={`tel:${selectedProperty.owner_contact}`}
                  className="flex flex-col items-center gap-1 py-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-[9px] font-bold">Owner</span>
                </a>
              ) : (
                <div className="flex flex-col items-center gap-1 py-3 text-zinc-200">
                  <Phone className="h-4 w-4" />
                  <span className="text-[9px] font-bold">Owner</span>
                </div>
              )}
              {perms.canDeleteProperties ? (
                <button
                  onClick={() => handleDeleteProperty(selectedProperty.id)}
                  className="flex flex-col items-center gap-1 py-3 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-[9px] font-bold">Delete</span>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-1 py-3 text-zinc-200">
                  <Trash2 className="h-4 w-4" />
                  <span className="text-[9px] font-bold">Delete</span>
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">

              {/* Property Images */}
              <div className="p-5 border-b border-[#f5f5f3]">
                {drawerImagesLoading ? (
                  <div className="h-40 bg-zinc-100 rounded-xl animate-pulse flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-zinc-300" />
                  </div>
                ) : drawerImages.length > 0 ? (
                  <ImageSlider
                    images={drawerImages}
                    aspectRatio="video"
                    showThumbnails={true}
                    showControls={true}
                    showZoom={true}
                    showDownload={true}
                  />
                ) : (
                  <div className="h-32 bg-[#fafaf8] border border-[#ebebeb] rounded-xl flex flex-col items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-zinc-300 mb-1.5" />
                    <p className="text-[10px] text-zinc-400 font-medium">No images uploaded</p>
                  </div>
                )}
              </div>

              {/* Property details key-value */}
              <div className="px-5 py-3 border-b border-[#f5f5f3]">
                <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.12em] mb-3">Property Details</div>
                <div className="space-y-2">
                  {[
                    ['Type', selectedProperty.property_type || '—'],
                    ['Configuration', selectedProperty.configuration || '—'],
                    ['Carpet Area', selectedProperty.carpet_area ? `${selectedProperty.carpet_area} sqft` : '—'],
                    ['Built-up Area', selectedProperty.built_up_area ? `${selectedProperty.built_up_area} sqft` : '—'],
                    ['Listing Type', selectedProperty.listing_type || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-zinc-400">{k}</span>
                      <span className="text-[10px] font-bold text-zinc-700">{v}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-zinc-400">Price</span>
                    <span className="text-[10px] font-bold text-[#d4ad4d]">{formatPriceShort(selectedProperty.price)}</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="px-5 py-3 border-b border-[#f5f5f3]">
                <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.12em] mb-3">Location</div>
                <div className="text-[11px] font-bold text-zinc-800">{selectedProperty.location || '—'}</div>
                {selectedProperty.address && (
                  <div className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{selectedProperty.address}</div>
                )}
              </div>

              {/* Description */}
              {selectedProperty.description && (
                <div className="px-5 py-3 border-b border-[#f5f5f3]">
                  <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.12em] mb-2">Description</div>
                  <p className="text-[10.5px] text-zinc-600 font-medium leading-relaxed">{selectedProperty.description}</p>
                </div>
              )}

              {/* Owner */}
              <div className="px-5 py-3 border-b border-[#f5f5f3]">
                <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.12em] mb-3">Owner / Stakeholder</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 text-[11px] font-bold">
                      {selectedProperty.owner_name?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-zinc-800">{selectedProperty.owner_name || 'Anonymous Owner'}</div>
                      <div className="text-[9.5px] text-zinc-400">{selectedProperty.owner_contact || 'No contact'}</div>
                    </div>
                  </div>
                  {selectedProperty.owner_contact && (
                    <a href={`tel:${selectedProperty.owner_contact}`} className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 transition-colors">
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                  )}
                </div>
              </div>

              {/* Internal Notes */}
              <div className="px-5 py-3">
                <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.12em] mb-2">Internal Notes</div>
                <textarea
                  className="w-full h-24 p-3 border border-[#e8e7e4] rounded-xl text-[11px] font-medium text-zinc-700 placeholder-zinc-300 bg-[#fafaf8] focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 resize-none transition-all"
                  placeholder="Add private notes for the sales team..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[#ebebeb] flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleShareWhatsApp([selectedProperty])}
                className="flex-1 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Send to Client
              </button>
              <Link
                href={`/properties/${selectedProperty.id}`}
                className="py-2.5 px-4 rounded-xl bg-zinc-900 text-white text-[11px] font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5"
              >
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Dock */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-950 text-white rounded-2xl shadow-2xl border border-zinc-800 px-5 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2.5 shrink-0 border-r border-zinc-800 pr-5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-white text-[10px] font-black flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-[11px] font-bold tracking-wide uppercase text-zinc-400">Listings Selected</span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleShareWhatsApp()}
              className="px-3.5 py-2 bg-emerald-950/60 border border-emerald-800 text-emerald-250 rounded-xl text-xs font-bold hover:bg-emerald-900 hover:text-white transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
              WhatsApp
            </button>

            <button
              onClick={() => handleShareEmail()}
              className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-bold hover:bg-zinc-800 hover:text-white transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5 text-zinc-500" />
              Email
            </button>

            <button
              onClick={() => handleCopyDetails()}
              className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-bold hover:bg-zinc-800 hover:text-white transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5 text-zinc-550" />
              Copy Spec
            </button>

            {perms.canDeleteProperties && (
              <button
                onClick={handleBulkDelete}
                className="px-3.5 py-2 bg-rose-950/60 border border-rose-800 text-rose-250 rounded-xl text-xs font-bold hover:bg-rose-900 hover:text-white transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                Delete Selected
              </button>
            )}
          </div>

          <button 
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
