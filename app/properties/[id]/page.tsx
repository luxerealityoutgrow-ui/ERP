"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchProperty, Property } from '@/lib/queries';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, formatPriceShort, formatDate } from '@/lib/formatters';
import { ImageSlider } from '@/components/ui/image-slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  User,
  FileText,
  Ruler,
  Tag,
  Calendar,
  Edit,
  CheckCircle,
  Clock,
  Home,
  IndianRupee,
  Copy,
  ExternalLink,
  Layers,
  Share2,
  MessageSquare,
  Mail
} from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadProperty = async () => {
      try {
        const [prop, imgResult] = await Promise.all([
          fetchProperty(id),
          supabase.from('property_images').select('url').eq('property_id', id).order('sort_order', { ascending: true })
        ]);
        setProperty(prop);
        if (imgResult.data && imgResult.data.length > 0) {
          const signedUrls = await Promise.all(
            imgResult.data.map(async (img) => {
              if (img.url.startsWith('http')) return img.url;
              const { data: sData } = await supabase.storage
                .from('property-images')
                .createSignedUrl(img.url, 604800);
              return sData?.signedUrl || img.url;
            })
          );
          setImages(signedUrls);
        }
      } catch (err) {
        console.error('Error loading property:', err);
      } finally {

        setLoading(false);
      }
    };

    loadProperty();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!property) return;
    setUpdating(true);
    const updateData: Record<string, unknown> = { status_id: newStatus };
    if (newStatus === 'Sold') {
      updateData.is_active = false;
    }
    try {
      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', property.id);
      if (!error) {
        setProperty({ 
          ...property, 
          status_id: newStatus,
          ...(newStatus === 'Sold' ? { is_active: false } : {})
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const copyPropertyCode = () => {
    if (property?.property_code) {
      navigator.clipboard.writeText(property.property_code);
    }
  };

  const getPropertyShareText = () => {
    if (!property) return '';
    const priceStr = property.price ? formatCurrency(property.price) : 'Price on request';
    return `${property.title}
Location: ${property.location}
Price: ${priceStr}
Type: ${property.property_type} (${property.configuration || 'N/A'})
Area: ${property.carpet_area ? `${property.carpet_area} sqft` : 'N/A'}
Listing: For ${property.listing_type}
Code: ${property.property_code}

${property.description || ''}`;
  };

  const handleShareWhatsApp = () => {
    const text = getPropertyShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Property Details: ${property?.title} (${property?.property_code})`;
    const body = getPropertyShareText().replace(/\*/g, '');
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handleCopyDetails = () => {
    const text = getPropertyShareText().replace(/\*/g, '');
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <div className="h-8 w-48 bg-zinc-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-[400px] bg-zinc-100 rounded-2xl animate-pulse" />
            <div className="h-32 bg-zinc-100 rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-zinc-100 rounded-2xl animate-pulse" />
            <div className="h-48 bg-zinc-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-6xl mx-auto py-20 text-center">
        <Building2 className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Property Not Found</h2>
        <p className="text-sm text-zinc-500 mb-6">The property you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/properties">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </Link>
      </div>
    );
  }

  const statusColor = {
    'Available': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Under Offer': 'bg-amber-50 text-amber-700 border-amber-200',
    'Sold': 'bg-zinc-100 text-zinc-600 border-zinc-200',
  }[property.status_id || 'Available'] || 'bg-zinc-50 text-zinc-600 border-zinc-200';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/properties" className="hover:text-zinc-700 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Properties
          </Link>
          <span>/</span>
          <span className="text-zinc-900 font-medium">{property.title}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{property.title}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
                {property.status_id || 'Available'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <button
                onClick={copyPropertyCode}
                className="flex items-center gap-1 hover:text-zinc-700 transition-colors"
                title="Copy property code"
              >
                <Tag className="h-3.5 w-3.5" />
                <span className="font-mono font-medium">{property.property_code}</span>
                <Copy className="h-3 w-3 ml-0.5" />
              </button>
              {property.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Listed {formatDate(property.created_at)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDetails}
              className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
              title="Copy property details"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 border border-emerald-200 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="Share via WhatsApp"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              WhatsApp
            </button>
            <button
              onClick={handleShareEmail}
              className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
              title="Share via Email"
            >
              <Mail className="h-3.5 w-3.5" />
            </button>
            <Link href={`/properties/edit?id=${property.id}`}>
              <Button variant="outline" className="gap-1.5 text-xs font-bold">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
            {property.status_id !== 'Sold' && (
              <Button
                onClick={() => handleStatusUpdate('Sold')}
                disabled={updating}
                className="gap-1.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Mark Sold
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          {images.length > 0 ? (
            <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-white">
              <ImageSlider
                images={images}
                aspectRatio="video"
                showThumbnails={true}
                showControls={true}
                showZoom={true}
                showDownload={true}
                className="p-0"
              />
            </div>
          ) : (
            <div className="h-[300px] rounded-2xl border border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center">
              <Building2 className="h-12 w-12 text-zinc-300 mb-3" />
              <p className="text-sm text-zinc-400 font-medium">No images uploaded yet</p>
            </div>
          )}

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center space-y-1">
              <IndianRupee className="h-4 w-4 text-zinc-400 mx-auto" />
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Price</p>
              <p className="text-sm font-bold text-zinc-900">{formatPriceShort(property.price)}</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center space-y-1">
              <Home className="h-4 w-4 text-zinc-400 mx-auto" />
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Config</p>
              <p className="text-sm font-bold text-zinc-900">{property.configuration || '—'}</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center space-y-1">
              <Ruler className="h-4 w-4 text-zinc-400 mx-auto" />
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Carpet Area</p>
              <p className="text-sm font-bold text-zinc-900">{property.carpet_area ? `${property.carpet_area} sqft` : '—'}</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center space-y-1">
              <Layers className="h-4 w-4 text-zinc-400 mx-auto" />
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Built-up</p>
              <p className="text-sm font-bold text-zinc-900">{property.built_up_area ? `${property.built_up_area} sqft` : '—'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-500" />
              Description
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
              {property.description || 'No description provided for this listing.'}
            </p>
          </div>

          {/* Location & Address */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="h-4 w-4 text-zinc-500" />
              Location
            </h3>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-zinc-900">{property.location}</p>
              {property.address && (
                <p className="text-sm text-zinc-500 leading-relaxed">{property.address}</p>
              )}
            </div>
          </div>

          {/* Internal Notes */}
          {property.internal_notes && (
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-6 space-y-3">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" />
                Internal Sales Notes
              </h3>
              <p className="text-sm text-amber-900/80 leading-relaxed whitespace-pre-wrap">
                {property.internal_notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Asking Price</p>
              <p className="text-2xl font-bold text-zinc-900">{formatCurrency(property.price)}</p>
              {property.carpet_area && property.price ? (
                <p className="text-xs text-zinc-500">
                  {formatCurrency(Math.round(property.price / property.carpet_area))}/sqft
                </p>
              ) : null}
            </div>

            <div className="border-t border-zinc-100 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Type</span>
                <span className="font-medium text-zinc-900">{property.property_type}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Listing</span>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  For {property.listing_type}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Configuration</span>
                <span className="font-medium text-zinc-900">{property.configuration || '—'}</span>
              </div>
            </div>
          </div>

          {/* Owner Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-500" />
              Owner / Stakeholder
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-sm">
                {property.owner_name?.charAt(0) || 'O'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-900 truncate">{property.owner_name || 'Anonymous Owner'}</p>
                <p className="text-xs text-zinc-500">{property.owner_contact || 'No contact'}</p>
              </div>
            </div>
            {property.owner_contact && (
              <a
                href={`tel:${property.owner_contact}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call Owner
              </a>
            )}
          </div>

          {/* Area Details Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Ruler className="h-4 w-4 text-zinc-500" />
              Area Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Carpet Area</span>
                <span className="font-medium text-zinc-900">{property.carpet_area ? `${property.carpet_area} sqft` : '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Built-up Area</span>
                <span className="font-medium text-zinc-900">{property.built_up_area ? `${property.built_up_area} sqft` : '—'}</span>
              </div>
              {property.carpet_area && property.built_up_area ? (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-zinc-100">
                  <span className="text-zinc-500">Loading Factor</span>
                  <span className="font-medium text-zinc-900">
                    {((property.built_up_area / property.carpet_area - 1) * 100).toFixed(1)}%
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Status Actions */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Share2 className="h-4 w-4 text-zinc-500" />
              Send to Client
            </h3>
            <p className="text-[11px] text-zinc-500">Share property details with prospective clients.</p>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Send via WhatsApp
              </button>
              <button
                onClick={handleShareEmail}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all border border-zinc-200 text-zinc-700 hover:bg-zinc-50 flex items-center justify-center gap-2"
              >
                <Mail className="h-3.5 w-3.5" />
                Send via Email
              </button>
              <button
                onClick={handleCopyDetails}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all border border-zinc-200 text-zinc-700 hover:bg-zinc-50 flex items-center justify-center gap-2"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Details
              </button>
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-500" />
              Update Status
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {['Available', 'Under Offer', 'Sold'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updating || property.status_id === status}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    property.status_id === status
                      ? 'bg-zinc-900 text-white cursor-default'
                      : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
