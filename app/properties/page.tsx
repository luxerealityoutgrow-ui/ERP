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
  X,
  Phone,
  User,
  CheckCircle,
  FileText,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatNumber } from '@/lib/formatters';

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
      description: 'Stunning organic modern architectural masterpiece in the heart of Pune. Features full-height glass walls, infinity edge balcony, and state-of-the-art home automation.'
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
      description: 'Exclusive double-height glass ceiling penthouse offering panoramic views of the city skyline. Includes private terrace pool and dedicated concierge services.'
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
      description: 'Minimalist contemporary villa blended with traditional Indian architectural elements. Features large courtyards and expansive landscaped gardens.'
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
      description: 'Modern high-rise apartment with premium finishes and smart home features. Located in the tech hub of the city with excellent connectivity.'
    }
  ];

  const displayProperties = properties.length > 0 ? properties : mockProperties;

  // Filter and search logic
  const filteredProperties = displayProperties.filter(prop => {
    const matchesSearch = 
      (prop.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prop.property_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prop.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      
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
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header with Search & Tab Controls */}
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
            
            <Link href="/properties/create">
              <button className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-sm">
                <Plus className="h-4 w-4" />
                New Listing
              </button>
            </Link>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100/80 rounded-xl w-fit">
          {['All', 'Available', 'Under Offer', 'Sold'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

      {/* Property Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-[420px] bg-white border border-zinc-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((prop) => (
            <div 
              key={prop.id}
              onClick={() => handleOpenProperty(prop)}
              className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-500/50 hover:shadow-xl hover:shadow-zinc-500/5 transition-all duration-300 cursor-pointer flex flex-col h-full"
            >
              {/* Image Thumbnail Placeholder */}
              <div className="h-52 bg-zinc-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent z-10" />
                <img 
                  src={prop.id === 'prop-1' ? '/images/luxe-1.webp' : prop.id === 'prop-2' ? '/images/luxe-2.webp' : prop.id === 'prop-3' ? '/images/luxe-3.webp' : prop.id === 'prop-4' ? '/images/luxe-5.webp' : '/images/luxe-1.webp'}
                  alt={prop.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                <span className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md z-20 ${
                  prop.status_id === 'Available' ? 'bg-zinc-500/20 text-zinc-100 border-zinc-500/30' :
                  prop.status_id === 'Under Offer' ? 'bg-amber-500/20 text-amber-100 border-amber-500/30' :
                  'bg-zinc-500/20 text-zinc-100 border-zinc-500/30'
                }`}>
                  {prop.status_id}
                </span>
                
                <div className="absolute bottom-4 left-4 z-20">
                  <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm">{prop.title}</h3>
                  <div className="flex items-center gap-1 text-zinc-200 text-[10px] font-medium mt-1">
                    <MapPin className="h-3 w-3" />
                    {prop.location}
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 font-bold text-lg">
                      {prop.price ? formatCurrency(prop.price) : '₹1.20 Cr'}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{prop.property_code}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-100">
                    <div className="flex flex-col items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-700">{prop.configuration}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 border-x border-zinc-100">
                      <Bath className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-700">3 Baths</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Maximize2 className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-700">{prop.carpet_area} sqft</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                      {prop.owner_name ? prop.owner_name.charAt(0) : 'O'}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-900 leading-none">{prop.owner_name || 'Direct Owner'}</p>
                      <p className="text-[9px] font-medium text-zinc-400 mt-0.5">Primary Contact</p>
                    </div>
                  </div>
                  
                  <button className="h-8 w-8 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-500 hover:border-zinc-500 transition-colors">
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-50 rounded-2xl p-4 text-center">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Price</p>
                  <p className="text-sm font-bold text-zinc-900">{formatCurrency(selectedProperty.price || 0)}</p>
                </div>
                <div className="bg-zinc-50 rounded-2xl p-4 text-center">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Configuration</p>
                  <p className="text-sm font-bold text-zinc-900">{selectedProperty.configuration}</p>
                </div>
                <div className="bg-zinc-50 rounded-2xl p-4 text-center">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Area</p>
                  <p className="text-sm font-bold text-zinc-900">{selectedProperty.carpet_area} sqft</p>
                </div>
                <div className="bg-zinc-50 rounded-2xl p-4 text-center">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-sm font-bold text-zinc-900">{selectedProperty.status_id}</p>
                </div>
              </div>

              {/* Location & Address */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-500" />
                  Location Details
                </h3>
                <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/50">
                  <p className="text-sm font-bold text-zinc-900 mb-1">{selectedProperty.location}</p>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">{selectedProperty.address}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-500" />
                  Description
                </h3>
                <p className="text-sm text-zinc-600 font-medium leading-relaxed">
                  {selectedProperty.description || 'No description provided for this listing.'}
                </p>
              </div>

              {/* Owner Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4 text-zinc-500" />
                  Owner / Stakeholder
                </h3>
                <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold">
                      {selectedProperty.owner_name?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{selectedProperty.owner_name || 'Anonymous Owner'}</p>
                      <p className="text-xs text-zinc-500 font-medium">{selectedProperty.owner_contact || 'No contact provided'}</p>
                    </div>
                  </div>
                  <a href={`tel:${selectedProperty.owner_contact}`} className="text-zinc-600 hover:text-zinc-500 flex items-center gap-1.5 font-bold">
                    <Phone className="h-4 w-4" />
                    <span className="text-xs">Call</span>
                  </a>
                </div>
              </div>

              {/* Internal Sales Notes */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Internal Sales Notes</h3>
                <textarea 
                  className="w-full h-32 p-4 rounded-2xl border border-zinc-200 text-sm font-medium focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 outline-none transition-all resize-none bg-zinc-50/30"
                  placeholder="Add private notes for the sales team..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
              <button 
                onClick={() => handleUpdateStatus('Sold')}
                className="flex-1 py-3 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Mark as Sold
              </button>
              <button 
                onClick={() => handleUpdateStatus('Under Offer')}
                className="flex-1 py-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs font-bold hover:bg-zinc-50 transition-all"
              >
                Set Under Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
