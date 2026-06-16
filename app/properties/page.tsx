"use client";

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/lib/auth';
import { fetchProperties, Property } from '@/lib/queries';
import { 
  Home, 
  Search, 
  Plus, 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize2, 
  DollarSign, 
  X,
  Phone,
  User,
  CheckCircle,
  FileText,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export default function PropertyInventoryPage() {
  const profile = useProfile();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Fetch properties on load
  useEffect(() => {
    if (!profile) return;
    fetchProperties(profile)
      .then(setProperties)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  // Fallback mock properties if DB is empty
  const mockProperties: Property[] = [
    {
      id: 'prop-1',
      title: 'The Obsidian Villa',
      property_code: 'PROP-OBS-01',
      location: 'Beverly Hills',
      address: '9424 Sierra Mar Pl, Beverly Hills, CA 90210',
      property_type: 'Villa',
      configuration: '5 BHK',
      price: 4850000,
      carpet_area: 6500,
      status_id: 'Available',
      listing_type: 'Sale',
      owner_name: 'Genevieve H. Vance',
      owner_contact: '+1 (555) 303-9912',
      description: 'Stunning organic modern architectural masterpiece overlooking the city skyline. Features glass pocket doors, infinity edge pool, and state of the art home automation systems.'
    },
    {
      id: 'prop-2',
      title: 'Elysian Glass Penthouse',
      property_code: 'PROP-ELY-02',
      location: 'Malibu',
      address: '24180 Pacific Coast Hwy, Malibu, CA 90265',
      property_type: 'Penthouse',
      configuration: '3 BHK',
      price: 3200000,
      carpet_area: 3800,
      status_id: 'Available',
      listing_type: 'Sale',
      owner_name: 'Arthur Pendelton',
      owner_contact: '+1 (555) 891-2241',
      description: 'Exclusive double-height glass ceiling penthouse offering panoramic views of the Pacific Ocean. Includes direct private beach access and full-service concierge services.'
    },
    {
      id: 'prop-3',
      title: 'Minimalist Concrete Haven',
      property_code: 'PROP-MIN-03',
      location: 'Los Angeles',
      address: '1842 Sunset Blvd, Los Angeles, CA 90026',
      property_type: 'Modern House',
      configuration: '4 BHK',
      price: 2900000,
      carpet_area: 4100,
      status_id: 'Under Offer',
      listing_type: 'Sale',
      owner_name: 'Nicolette Ross',
      owner_contact: '+1 (555) 474-0019',
      description: 'Brutalist concrete block construction blended with warm Japanese timber styles. Features private bamboo courtyards and open sky wells.'
    },
    {
      id: 'prop-4',
      title: 'Serene Coastal Villa',
      property_code: 'PROP-SEA-04',
      location: 'Malibu',
      address: '32004 Broad Beach Rd, Malibu, CA 90265',
      property_type: 'Villa',
      configuration: '6 BHK',
      price: 5150000,
      carpet_area: 7200,
      status_id: 'Available',
      listing_type: 'Sale',
      owner_name: 'Cynthia Sterling',
      owner_contact: '+1 (555) 124-7685',
      description: 'Cape Cod style coastal estate directly on the beach dunes. Custom white oak millwork, chefs kitchen, master suite with private viewing deck.'
    }
  ];

  const displayProperties = properties.length > 0 ? properties : mockProperties;

  // Filter and search logic
  const filteredProperties = displayProperties.filter(prop => {
    const matchesSearch = 
      prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.property_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (activeTab === 'All') return matchesSearch;
    return matchesSearch && prop.status_id === activeTab;
  });

  // Handle open property drawer
  const handleOpenProperty = (prop: Property) => {
    setSelectedProperty(prop);
    setNoteText(prop.internal_notes || '');
    setIsDrawerOpen(true);
  };

  // Update property status
  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedProperty) return;
    const updated = { ...selectedProperty, status_id: newStatus };
    setSelectedProperty(updated);
    
    // Update state
    setProperties(prev => {
      const idx = prev.findIndex(p => p.id === selectedProperty.id);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });
  };

  // Save notes locally
  const handleSaveNotes = () => {
    if (!selectedProperty) return;
    const updated = { ...selectedProperty, internal_notes: noteText };
    setSelectedProperty(updated);
    
    // Update state
    setProperties(prev => {
      const idx = prev.findIndex(p => p.id === selectedProperty.id);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-zinc-900">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Home className="h-6 w-6 text-emerald-500" />
            Property Inventory
          </h1>
          <p className="text-xs text-zinc-500">
            Browse and manage your high-value luxury real estate portfolio database.
          </p>
        </div>
        <Link href="/properties/create">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-xs font-bold text-zinc-950 hover:brightness-110 shadow-md shadow-emerald-500/10 transition-all">
            <Plus className="h-4 w-4" />
            Add Property
          </button>
        </Link>
      </div>

      {/* Filtering and Search bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-50 p-4 border border-zinc-200 rounded-2xl">
        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1">
          {['All', 'Available', 'Under Offer'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === tab 
                  ? 'bg-white text-emerald-600 border border-zinc-200 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search code, title, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((prop, idx) => {
          // Resolve correct image
          const imagePath = idx % 3 === 0 
            ? '/images/house1.png' 
            : idx % 3 === 1 
              ? '/images/house2.png' 
              : '/images/house3.png';
          
          return (
            <div 
              key={prop.id}
              onClick={() => handleOpenProperty(prop)}
              className="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-lg hover:border-zinc-300 hover:translate-y-[-2px] transition-all duration-300 cursor-pointer group"
            >
              {/* Photo section */}
              <div className="relative h-48 w-full bg-zinc-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imagePath} 
                  alt={prop.title} 
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                />
                
                {/* Overlay status */}
                <span className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                  prop.status_id === 'Available' 
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' 
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                }`}>
                  {prop.status_id || 'Available'}
                </span>

                {/* Overlay code */}
                <span className="absolute bottom-4 left-4 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-zinc-800/70 border border-zinc-700 text-zinc-300 uppercase tracking-widest">
                  {prop.property_code}
                </span>
              </div>

              {/* Title & Description */}
              <div className="p-5 space-y-4">
                <div>
                  <h4 className="text-[10px] font-semibold text-zinc-500 tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500/80" />
                    {prop.location}
                  </h4>
                  <h3 className="text-base font-bold text-zinc-800 mt-1 group-hover:text-emerald-600 transition-colors truncate">
                    {prop.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 h-8">
                    {prop.description || 'No description provided.'}
                  </p>
                </div>

                {/* Dimensions and pricing */}
                <div className="flex items-center justify-between pt-3.5 border-t border-zinc-100">
                  <span className="text-lg font-extrabold text-emerald-600">
                    {prop.price ? `$${Number(prop.price).toLocaleString()}` : '$1,200,000'}
                  </span>
                  
                  <div className="flex items-center gap-3.5 text-zinc-500 text-xs font-semibold">
                    <span className="flex items-center gap-1" title="Bedrooms">
                      <BedDouble className="h-4 w-4 text-zinc-400" />
                      {prop.configuration ? prop.configuration.charAt(0) : '4'}
                    </span>
                    <span className="flex items-center gap-1" title="Area Sqft">
                      <Maximize2 className="h-3.5 w-3.5 text-zinc-400" />
                      {(prop.carpet_area || prop.built_up_area || 4200).toLocaleString()} sqft
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProperties.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-zinc-400">
            No properties found matching search or filter tab.
          </div>
        )}
      </div>

      {/* Side Slide-Over Details Drawer */}
      {isDrawerOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/40 backdrop-blur-xs">
          {/* Back click close */}
          <div className="flex-1 cursor-default" onClick={() => setIsDrawerOpen(false)} />
          
          {/* Drawer container */}
          <div className="w-full max-w-md bg-white border-l border-zinc-200 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
                    <Home className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 tracking-widest uppercase">{selectedProperty.property_code}</h3>
                    <span className="text-[10px] text-zinc-500">Property Details</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Status Update Actions */}
              <div className="py-4 space-y-2 border-b border-zinc-200">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Update Property Status</h4>
                <div className="grid grid-cols-3 gap-2">
                  {['Available', 'Under Offer', 'Sold'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(status)}
                      className={`py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        selectedProperty.status_id === status
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm'
                          : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:text-zinc-700'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields details */}
              <div className="py-5 space-y-4 text-xs border-b border-zinc-200">
                
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Property Title</span>
                  <span className="text-zinc-800 font-bold text-sm block">{selectedProperty.title}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Full Address</span>
                  <span className="text-zinc-700 font-semibold flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    {selectedProperty.address || selectedProperty.location}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Asking Price</span>
                    <span className="text-emerald-600 font-extrabold text-sm block">
                      ${Number(selectedProperty.price || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Structure Setup</span>
                    <span className="text-zinc-700 font-semibold block">
                      {selectedProperty.property_type || 'Villa'} ({selectedProperty.configuration || '3 BHK'})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Carpet Area</span>
                    <span className="text-zinc-700 font-semibold block">
                      {selectedProperty.carpet_area || 4200} sqft
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Listing Type</span>
                    <span className="text-zinc-500 font-semibold uppercase tracking-wider">
                      For {selectedProperty.listing_type || 'Sale'}
                    </span>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Owner Contact Details</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="font-semibold text-zinc-700">{selectedProperty.owner_name || 'Genevieve Vance'}</span>
                    </div>
                    <a href={`tel:${selectedProperty.owner_contact}`} className="text-emerald-600 hover:text-emerald-500 flex items-center gap-1.5 font-bold">
                      <Phone className="h-3.5 w-3.5" />
                      {selectedProperty.owner_contact || '+1 (555) 303-9912'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Internal agent notes */}
              <div className="py-4 space-y-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Internal Agent Notes</span>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record viewing schedules, customer feedback, and negotiations..."
                  className="w-full h-24 bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none"
                />
                <button 
                  onClick={handleSaveNotes}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-[10px] font-bold text-zinc-700 uppercase tracking-wider transition-colors"
                >
                  Save Notes
                </button>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-4 border-t border-zinc-200 flex items-center gap-2">
              <button 
                onClick={() => alert(`Creating Site Visit proposal...`)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all"
              >
                Schedule Visit
              </button>
              <button 
                onClick={() => alert(`Sharing property brochure with matches...`)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-700 transition-all"
              >
                Find Matches
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
