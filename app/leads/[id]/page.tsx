"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Lead } from '@/lib/queries';
import { useProfile } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import {
  ChevronLeft,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Clock,
  Sparkles,
  Tag,
  Share2,
  Copy,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  QrCode
} from 'lucide-react';
import Link from 'next/link';
import { QRCodeModal } from '@/components/QRCodeModal';

// Helper to format currency
function formatBudgetAbbreviated(value: number | undefined | null) {
  if (!value) return "";
  if (value >= 10000000) {
    const cr = value / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    const lakhs = value / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(2)} L`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const profile = useProfile();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);

  useEffect(() => {
    if (!id || !profile) return;
 
    const fetchLeadData = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', id)
          .single();
 
        if (error) {
          setError(error.message);
        } else {
          const perms = getPermissions(profile.role);
          if (!perms.canViewAllLeads && data.assigned_to !== profile.id) {
            setError("You do not have permission to view this lead");
          } else {
            setLead(data);
            setNoteText(data.notes || '');
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch lead");
      } finally {
        setLoading(false);
      }
    };
 
    fetchLeadData();
  }, [id, profile]);

  // Toast auto-dismissal
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!lead) return;
    setLead(prev => prev ? { ...prev, status: newStatus } : null);
    setToast({ msg: "Status updated.", tone: "ok" });
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', lead.id);
      if (error) {
        setToast({ msg: `Failed: ${error.message}`, tone: "err" });
      }
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to update status", tone: "err" });
    }
  };

  const handleSaveNotes = async () => {
    if (!lead) return;
    setIsSavingNote(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes: noteText })
        .eq('id', lead.id);
      if (error) {
        setToast({ msg: `Failed to save notes: ${error.message}`, tone: "err" });
      } else {
        setLead(prev => prev ? { ...prev, notes: noteText } : null);
        setToast({ msg: "Notes saved.", tone: "ok" });
      }
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to save notes", tone: "err" });
    } finally {
      setIsSavingNote(false);
    }
  };

  // Generate clean sharing description text
  const generateShareText = (l: Lead) => {
    // The lead form only ever collects a single "Max Budget" value -- budget_min is never
    // set through the UI -- so gating this on budget_min (as before) always fell through to
    // "Flexible" even when a real budget had been entered. Gate on budget_max instead, and
    // only show a min-max range on the rare lead that does have both.
    const budgetStr = l.budget_max
      ? (l.budget_min && l.budget_min !== l.budget_max
          ? `${formatBudgetAbbreviated(l.budget_min)} - ${formatBudgetAbbreviated(l.budget_max)}`
          : formatBudgetAbbreviated(l.budget_max))
      : 'Flexible';
    return `📋 *LUXE REALTY LEAD DETAILS*
👤 *Client Name:* ${l.client_name}
📞 *Phone:* ${l.phone || 'N/A'}
✉️ *Email:* ${l.email || 'N/A'}
💰 *Budget:* ${budgetStr}
📍 *Preferred Location:* ${l.preferred_location || 'Flexible'}
🏢 *Property Type:* ${l.property_type || 'N/A'} (${l.configuration || 'Any'})
💼 *Transaction:* ${l.transaction_type || 'Outright'} / ${l.category || 'Residential'}
📝 *Notes:* ${l.notes || 'None'}`;
  };

  const copyToClipboard = async (text: string, successMsg = "Copied to clipboard!") => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ msg: successMsg, tone: "ok" });
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to copy text", tone: "err" });
    }
  };

  const shareWhatsApp = (l: Lead) => {
    const text = encodeURIComponent(generateShareText(l));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareEmail = (l: Lead) => {
    const subject = encodeURIComponent(`Lead Requirements - ${l.client_name}`);
    const body = encodeURIComponent(generateShareText(l));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  const getStatusStyle = (status: string | undefined) => {
    switch (status) {
      case 'Hot': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Warm': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'No answer': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Not reachable': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Switched off': return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      case 'Closed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-zinc-50 text-zinc-600 border-zinc-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        <p className="text-sm text-zinc-500 font-medium">Loading lead profile...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
        <Link href="/leads" className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Leads
        </Link>
        <div className="p-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-sm font-semibold shadow-xs">
          Error: {error || "Lead profile not found"}
        </div>
      </div>
    );
  }

  const shareableUrl = typeof window !== 'undefined' ? `${window.location.origin}/leads/${lead.id}` : '';

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4 pb-24">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link href="/leads" className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Leads Listing
        </Link>
        <Link href={`/leads/edit?id=${lead.id}`}>
          <button className="px-3.5 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all shadow-xs">
            Edit Lead
          </button>
        </Link>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card Header & Quick Contacts */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl overflow-hidden bg-zinc-100 flex items-center justify-center shadow-lg shadow-zinc-900/20">
                <img src="/lead-avatar.png" alt="" className="h-full w-full object-cover" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">{lead.client_name}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all ${getStatusStyle(lead.status)}`}>
                    {lead.status || 'Hot'}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-semibold">Added {new Date(lead.created_at || '').toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {['Hot', 'Warm', 'No answer', 'Not reachable', 'Switched off', 'Closed'].map((statusOption) => (
                <button
                  key={statusOption}
                  onClick={() => handleUpdateStatus(statusOption)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    lead.status === statusOption
                      ? getStatusStyle(statusOption) + ' border-zinc-400 shadow-xs'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 border-zinc-200'
                  }`}
                >
                  {statusOption}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Contact Actions */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" />
              Contact details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Phone number</p>
                  <a href={`tel:${lead.phone}`} className="text-xs font-bold text-zinc-900 hover:underline">{lead.phone || 'N/A'}</a>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Email address</p>
                  <a href={`mailto:${lead.email}`} className="text-xs font-bold text-zinc-900 hover:underline truncate block">{lead.email || 'N/A'}</a>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <a 
                href={`tel:${lead.phone}`}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 border border-zinc-200 transition-all cursor-pointer"
              >
                <Phone className="h-3.5 w-3.5" />
                Call Client
              </a>
              <a 
                href={`mailto:${lead.email}`}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 border border-zinc-200 transition-all cursor-pointer"
              >
                <Mail className="h-3.5 w-3.5" />
                Email Client
              </a>
              <button 
                onClick={() => shareWhatsApp(lead)}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp Details
              </button>
            </div>
          </div>

          {/* Client Requirement Grid */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5" />
              Client Requirements
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Budget Range</p>
                <p className="text-sm font-bold text-zinc-900">
                  {lead.budget_max
                    ? (lead.budget_min && lead.budget_min !== lead.budget_max
                        ? `${formatBudgetAbbreviated(lead.budget_min)} - ${formatBudgetAbbreviated(lead.budget_max)}`
                        : formatBudgetAbbreviated(lead.budget_max))
                    : 'Flexible'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Preferred Location</p>
                <p className="text-sm font-bold text-zinc-900 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{lead.preferred_location || 'Flexible'}</span>
                </p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Property Type</p>
                <p className="text-sm font-bold text-zinc-900">{lead.property_type || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Configuration</p>
                <p className="text-sm font-bold text-zinc-900">{lead.configuration || 'Any'}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Transaction Category</p>
                <p className="text-sm font-bold text-zinc-900">{lead.category || 'Residential'}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Transaction Type</p>
                <p className="text-sm font-bold text-zinc-900">{lead.transaction_type || 'Outright'}</p>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Interaction Notes
              </h2>
              <button 
                onClick={handleSaveNotes}
                disabled={isSavingNote}
                className="text-[10px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors border border-zinc-200 px-2.5 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                {isSavingNote ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
            
            <textarea 
              className="w-full h-36 p-4 rounded-xl border border-zinc-200 text-sm font-medium focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 outline-none transition-all resize-none bg-zinc-50/20"
              placeholder="Record follow-up details, client reactions, negotiations, or general notes..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
          </div>
        </div>

        {/* Side Panel: Sharing options & Metadata */}
        <div className="space-y-6">
          
          {/* Share Box Widget */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Share2 className="h-3.5 w-3.5" />
              Share lead
            </h2>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => copyToClipboard(generateShareText(lead), "Lead details copied!")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-200/60 text-xs font-bold transition-all text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  Copy details text
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold">Copy text</span>
              </button>
              
              <button
                onClick={() => copyToClipboard(shareableUrl, "Shareable URL copied!")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-200/60 text-xs font-bold transition-all text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                  Copy shareable link
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold">Copy link</span>
              </button>

              <button
                onClick={() => shareWhatsApp(lead)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-200/60 text-xs font-bold transition-all text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                  Share to WhatsApp
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">WhatsApp</span>
              </button>

              <button
                onClick={() => shareEmail(lead)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-200/60 text-xs font-bold transition-all text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-zinc-400" />
                  Share via Email
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold">Email</span>
              </button>

              <button
                onClick={() => setIsQrOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-200/60 text-xs font-bold transition-all text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <QrCode className="h-3.5 w-3.5 text-zinc-400" />
                  Show QR code
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold">QR code</span>
              </button>
            </div>
          </div>

          {/* Acquisition / Source card */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Acquisition Channel</p>
              <p className="text-xs font-extrabold text-zinc-900">{lead.lead_source_id || 'Direct Inquiry'}</p>
            </div>
            <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100">
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
          </div>

          {/* Stage Card */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-3">
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Current Sales Stage</p>
              <p className="text-sm font-extrabold text-zinc-900 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-zinc-500" />
                {lead.stage_id || 'New inquiry'}
              </p>
            </div>
            {lead.next_followup_date && (
              <div className="pt-2.5 border-t border-zinc-100">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Next Follow-Up</p>
                <p className="text-xs font-bold text-zinc-700">{new Date(lead.next_followup_date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal Integration */}
      <QRCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={shareableUrl}
        title={`Scan to view ${lead.client_name}'s requirements`}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-lg ring-1 transition-all bg-white ${
            toast.tone === "ok" ? "text-emerald-800 ring-emerald-200" : "text-red-800 ring-red-200"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${toast.tone === "ok" ? "bg-emerald-500" : "bg-red-500"}`} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
