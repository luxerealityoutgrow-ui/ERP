"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useProfile } from '@/lib/auth';
import { fetchProperties, Property } from '@/lib/queries';
import { supabase } from '@/lib/supabaseClient';
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
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatPriceShort } from '@/lib/formatters';
import { ImageSlider } from '@/components/ui/image-slider';

export default function PropertyInventoryPage() {
  const profile = useProfile();
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
          if (data && data.length > 0) {
            setProperties(data);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [profile]);

  // Fallback mock properties if DB is empty
  const mockProperties: Property[] = [
    {
      id: 'prop-1',
      title: 'Pristine Kyra',
      property_code: 'PROP-KYR-01',
      location: 'Kalyani Nagar',
      address: 'Pristine Kyra, Kalyani Nagar, Pune, Maharashtra 411006',
      property_type: 'Penthouse',
      configuration: '4 BHK',
      price: 31000000,
      carpet_area: 4500,
      status_id: 'Available',
      listing_type: 'Sale',
      owner_name: 'Vikram Seth',
      owner_contact: '+91 98200 12345',
      description: 'Stunning organic modern architectural masterpiece in the heart of Pune.'
    },
    {
      id: 'prop-2',
      title: 'Power Heights',
      property_code: 'PROP-POW-02',
      location: 'Koregaon Park',
      address: 'Power Heights, North Main Road, Koregaon Park, Maharashtra 411001',
      property_type: 'Luxury Apartment',
      configuration: '3 BHK',
      price: 13000000,
      carpet_area: 3200,
      status_id: 'Available',
      listing_type: 'Sale',
      owner_name: 'Aditya Birla',
      owner_contact: '+91 99100 54321',
      description: 'Exclusive double-height glass ceiling penthouse offering panoramic views.'
    },
    {
      id: 'prop-3',
      title: 'Vivencia',
      property_code: 'PROP-VIV-03',
      location: 'Baner',
      address: 'Vivencia, Baner Road, Pune, Maharashtra 411045',
      property_type: 'Villa',
      configuration: '5 BHK',
      price: 22000000,
      carpet_area: 8500,
      status_id: 'Under Offer',
      listing_type: 'Sale',
      owner_name: 'Nagarjuna Reddy',
      owner_contact: '+91 94400 98765',
      description: 'Minimalist contemporary villa blended with traditional Indian architecture.'
    },
    {
      id: 'prop-4',
      title: 'NYATI Evoque',
      property_code: 'PROP-NYA-04',
      location: 'Viman Nagar',
      address: 'NYATI Evoque, Viman Nagar, Pune, Maharashtra 411014',
      property_type: 'Apartment',
      configuration: '3 BHK',
      price: 35000000,
      carpet_area: 2400,
      status_id: 'Available',
      listing_type: 'Sale',
      owner_name: 'Rohan Murthy',
      owner_contact: '+91 80500 11223',
      description: 'Modern high-rise apartment with premium finishes and smart home features.'
    }
  ];

  const displayProperties = properties.length > 0 ? properties : mockProperties;

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

      return matchesSearch && matchesTab && matchesActiveState && matchesLocation && matchesPropertyType && matchesConfiguration && matchesListingType && matchesPrice && matchesArea;
    });
  }, [displayProperties, searchQuery, activeTab, activeState, filterLocations, filterPropertyType, filterConfiguration, filterListingType, filterPriceMin, filterPriceMax, filterAreaMin, filterAreaMax]);

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

  // Share functionality
  const getPropertyText = (prop: Property) => {
    return `🏠 *${prop.title}* (${prop.property_code})
📍 ${prop.location}
💰 ${formatPriceShort(prop.price)}
🏢 ${prop.property_type} | ${prop.configuration || 'N/A'}
📐 ${prop.carpet_area ? `${prop.carpet_area} sqft` : 'N/A'}
🔑 For ${prop.listing_type}
${prop.description ? `\n${prop.description}` : ''}`;
  };

  const getSelectedProperties = () => {
    return displayProperties.filter(p => selectedIds.has(p.id));
  };

  const handleShareWhatsApp = (props?: Property[]) => {
    const items = props || getSelectedProperties();
    if (items.length === 0) return;
    const header = items.length > 1 ? `📋 *${items.length} Properties from Luxe Realty*\n${'—'.repeat(20)}\n\n` : '';
    const text = header + items.map((p, i) => items.length > 1 ? `${i + 1}. ${getPropertyText(p)}` : getPropertyText(p)).join('\n\n---\n\n') + '\n\n_Shared from Luxe Realty ERP_';
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
        .eq('property_id', prop.id);
      if (data) {
        setDrawerImages(data.map(img => img.url));
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <Home className="h-6 w-6 text-zinc-500" />
              Property Inventory
            </h1>
            <p className="text-xs text-zinc-500 font-medium">Manage and track your exclusive real-estate listings across regions.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search properties, codes, locations..." 
                className="pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 w-64 md:w-80 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                showAdvancedFilters 
                  ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800' 
                  : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Drill Down
              {(filterLocations.length > 0 || filterPropertyType || filterConfiguration || filterListingType || filterPriceMin || filterPriceMax || filterAreaMin || filterAreaMax) && (
                <span className="ml-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {[filterLocations.length > 0, filterPropertyType, filterConfiguration, filterListingType, filterPriceMin || filterPriceMax, filterAreaMin || filterAreaMax].filter(Boolean).length}
                </span>
              )}
            </button>
            
            <Link href="/properties/create">
              <button className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-sm">
                <Plus className="h-4 w-4" />
                New Listing
              </button>
            </Link>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 p-1 bg-zinc-100/80 rounded-xl">
            {['Active', 'Inactive', 'All'].map((state) => (
              <button
                key={state}
                onClick={() => setActiveState(state as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeState === state 
                    ? state === 'Active' ? 'bg-emerald-500 text-white shadow-sm' 
                      : state === 'Inactive' ? 'bg-zinc-500 text-white shadow-sm'
                      : 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-zinc-200" />
          <div className="flex items-center gap-1 p-1 bg-zinc-100/80 rounded-xl">
            {['All', 'Available', 'Under Offer', 'Sold'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-zinc-900 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Drill Down Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
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
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Location</label>
              <button
                type="button"
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="w-full flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-medium text-left outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
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
                          filterLocations.includes(loc) ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
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
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Property Type</label>
              <select
                value={filterPropertyType}
                onChange={(e) => setFilterPropertyType(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
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
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Configuration</label>
              <select
                value={filterConfiguration}
                onChange={(e) => setFilterConfiguration(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
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
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Listing Type</label>
              <select
                value={filterListingType}
                onChange={(e) => setFilterListingType(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
              >
                <option value="">All</option>
                <option value="Sale">For Sale</option>
                <option value="Rent">For Rent</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Price Min (₹)</label>
              <input
                type="number"
                placeholder="e.g. 10000000"
                value={filterPriceMin}
                onChange={(e) => setFilterPriceMin(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Price Max (₹)</label>
              <input
                type="number"
                placeholder="e.g. 50000000"
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Area Min (sqft)</label>
              <input
                type="number"
                placeholder="e.g. 1000"
                value={filterAreaMin}
                onChange={(e) => setFilterAreaMin(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Area Max (sqft)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={filterAreaMax}
                onChange={(e) => setFilterAreaMax(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Property Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3">
            <div className="text-xs font-semibold text-zinc-700">
              {selectedIds.size} propert{selectedIds.size === 1 ? 'y' : 'ies'} selected
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShareWhatsApp()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Send via WhatsApp
              </button>
              <button
                onClick={() => handleShareEmail()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-50 transition-all cursor-pointer"
              >
                <Mail className="h-3.5 w-3.5" />
                Send via Email
              </button>
              <button
                onClick={() => handleCopyDetails()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-50 transition-all cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Details
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-14 bg-zinc-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80">
                  <th className="w-12 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(el) => { if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected; }}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Property</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Config</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Area</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Listing</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Owner</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Active</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Send</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center">
                      <Home className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-zinc-500">No properties match your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((prop) => (
                    <tr 
                      key={prop.id}
                      className="border-b border-zinc-50 hover:bg-zinc-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="w-12 px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(prop.id)}
                          onChange={(e) => toggleSelect(prop.id, e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500/20 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3" onClick={() => handleOpenProperty(prop)}>
                        <span className="text-xs font-bold text-zinc-900">{prop.title}</span>
                      </td>
                      <td className="px-4 py-3" onClick={() => handleOpenProperty(prop)}>
                        <span className="text-xs text-zinc-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-zinc-400" />
                          {prop.location}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={() => handleOpenProperty(prop)}>
                        <span className="text-xs font-medium text-zinc-700">{prop.property_type}</span>
                      </td>
                      <td className="px-4 py-3" onClick={() => handleOpenProperty(prop)}>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-zinc-200 bg-zinc-50 text-zinc-600">
                          {prop.configuration || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={() => handleOpenProperty(prop)}>
                        <span className="text-xs font-medium text-zinc-700">{prop.carpet_area ? `${prop.carpet_area} sqft` : '—'}</span>
                      </td>
                      <td className="px-4 py-3" onClick={() => handleOpenProperty(prop)}>
                        <span className="text-xs font-bold text-zinc-900">{formatPriceShort(prop.price)}</span>
                      </td>
                      <td className="px-4 py-3" onClick={() => handleOpenProperty(prop)}>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          prop.listing_type === 'Sale' 
                            ? 'border-blue-100 bg-blue-50 text-blue-700' 
                            : 'border-purple-100 bg-purple-50 text-purple-700'
                        }`}>
                          {prop.listing_type}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={() => handleOpenProperty(prop)}>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(prop.status_id)}`}>
                          {prop.status_id || 'Available'}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={() => handleOpenProperty(prop)}>
                        <span className="text-xs text-zinc-600 truncate max-w-[100px] block">{prop.owner_name || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleActive(prop.id, prop.is_active !== false)}
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors cursor-pointer ${
                            prop.is_active !== false
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'bg-zinc-200 border-zinc-200'
                          }`}
                          title={prop.is_active !== false ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform mt-px ${
                            prop.is_active !== false ? 'translate-x-4' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleShareWhatsApp([prop])}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600 transition-colors"
                          title="Send via WhatsApp"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && (
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 text-xs font-medium text-zinc-500">
            Showing {filteredProperties.length} of {displayProperties.length} properties
          </div>
        )}
      </div>

      {/* Property Details Drawer */}
      {isDrawerOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-zinc-600 uppercase tracking-widest bg-zinc-50 px-2 py-0.5 rounded mb-2 inline-block">
                  {selectedProperty.property_code}
                </span>
                <h2 className="text-xl font-bold text-zinc-900">{selectedProperty.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShareWhatsApp([selectedProperty])}
                  className="p-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                  title="Send via WhatsApp"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Property Images */}
              <div>
                {drawerImagesLoading ? (
                  <div className="h-48 bg-zinc-100 rounded-2xl animate-pulse flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-zinc-300" />
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
                  <div className="h-40 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-zinc-300 mb-2" />
                    <p className="text-xs text-zinc-400 font-medium">No images uploaded</p>
                  </div>
                )}
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-50 rounded-xl p-3 text-center">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Price</p>
                  <p className="text-sm font-bold text-zinc-900">{formatPriceShort(selectedProperty.price)}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3 text-center">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Configuration</p>
                  <p className="text-sm font-bold text-zinc-900">{selectedProperty.configuration || '—'}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3 text-center">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Area</p>
                  <p className="text-sm font-bold text-zinc-900">{selectedProperty.carpet_area ? `${selectedProperty.carpet_area} sqft` : '—'}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3 text-center">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-sm font-bold text-zinc-900">{selectedProperty.status_id || 'Available'}</p>
                </div>
              </div>

              {/* Location & Address */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-500" />
                  Location
                </h3>
                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
                  <p className="text-sm font-bold text-zinc-900 mb-1">{selectedProperty.location}</p>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">{selectedProperty.address}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-500" />
                  Description
                </h3>
                <p className="text-sm text-zinc-600 font-medium leading-relaxed">
                  {selectedProperty.description || 'No description provided.'}
                </p>
              </div>

              {/* Owner Information */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4 text-zinc-500" />
                  Owner / Stakeholder
                </h3>
                <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-sm">
                      {selectedProperty.owner_name?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{selectedProperty.owner_name || 'Anonymous Owner'}</p>
                      <p className="text-xs text-zinc-500 font-medium">{selectedProperty.owner_contact || 'No contact'}</p>
                    </div>
                  </div>
                  {selectedProperty.owner_contact && (
                    <a href={`tel:${selectedProperty.owner_contact}`} className="text-zinc-600 hover:text-zinc-500 flex items-center gap-1.5 font-bold">
                      <Phone className="h-4 w-4" />
                      <span className="text-xs">Call</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Internal Notes</h3>
                <textarea 
                  className="w-full h-28 p-4 rounded-xl border border-zinc-200 text-sm font-medium focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 outline-none transition-all resize-none bg-zinc-50/30"
                  placeholder="Add private notes for the sales team..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
              <button 
                onClick={() => handleShareWhatsApp([selectedProperty])}
                className="flex-1 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Send to Client
              </button>
              <button 
                onClick={() => handleCopyDetails([selectedProperty])}
                className="py-2.5 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
              <Link href={`/properties/${selectedProperty.id}`} className="py-2.5 px-4 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
