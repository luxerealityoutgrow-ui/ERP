"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useProfile } from '@/lib/auth';
import { fetchLeads, Lead } from '@/lib/queries';
import { supabase } from '@/lib/supabaseClient';
import { 
  Users, 
  Search, 
  Plus, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  CheckCircle,
  Clock,
  Sparkles,
  Tag,
  Trash2,
  ArrowUpRight,
  Edit3,
  ChevronDown,
  Share2,
  Copy,
  MessageSquare,
  ExternalLink,
  QrCode,
  SlidersHorizontal
} from 'lucide-react';
import { Download01 } from '@untitledui/icons';
import Link from 'next/link';
import { Table, TableCard } from '@/components/application/table/table';
import { CheckboxBase } from '@/components/base/checkbox/checkbox';
import { cx } from '@/utils/cx';
import { QRCodeModal } from '@/components/QRCodeModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const STICKY_DATE_CLASS = "sticky left-0 z-10 bg-white group-hover/row:bg-zinc-50 transition-colors shadow-[1px_0_0_0_rgba(16,24,40,0.06)]";
const STICKY_NAME_CLASS = "sticky left-[150px] z-10 bg-white group-hover/row:bg-zinc-50 transition-colors shadow-[1px_0_0_0_rgba(16,24,40,0.06)]";
const STICKY_DATE_HEADER_CLASS = "sticky left-0 z-20 bg-secondary shadow-[1px_0_0_0_rgba(16,24,40,0.06)]";
const STICKY_NAME_HEADER_CLASS = "sticky left-[150px] z-20 bg-secondary shadow-[1px_0_0_0_rgba(16,24,40,0.06)]";

const CELL_INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm outline-none transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 shrink-0";
const CELL_TEXTAREA_CLASS =
  "w-full min-w-[220px] resize-none rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm outline-none transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 shrink-0";

function formatDate(iso: string | undefined | null) {
  if (!iso) return "No date";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string | undefined | null) {
  if (!iso) return "No date";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Abbreviate currency values into Indian units: Cr (Crore) and L (Lakh)
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

export default function LeadsPage() {
  const profile = useProfile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'created_at' | 'client_name'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [qrLead, setQrLead] = useState<Lead | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);

  // Drill-down advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterLocations, setFilterLocations] = useState<string[]>([]);
  const [filterPropertyType, setFilterPropertyType] = useState('');
  const [filterConfiguration, setFilterConfiguration] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterTransactionType, setFilterTransactionType] = useState('');
  const [filterBudgetMin, setFilterBudgetMin] = useState('');
  const [filterBudgetMax, setFilterBudgetMax] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [activeState, setActiveState] = useState<'Active' | 'Inactive' | 'All'>('Active');
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  // Fetch locations for filter dropdown
  useEffect(() => {
    supabase.from('locations').select('name').order('name').then(({ data }) => {
      if (data) setAvailableLocations(data.map(l => l.name));
    });
  }, [leads]); // Re-fetch when leads update (in case new locations were added via properties)

  // Fetch leads on load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(profile)
        .then(data => {
          const allowedStatuses = ['Hot', 'Warm', 'No answer', 'Not reachable', 'Switched off', 'Closed'];
          const normalizedData = (data || []).map(lead => {
            let currentStatus = lead.status;
            if (!currentStatus || !allowedStatuses.includes(currentStatus)) {
              if (currentStatus === 'New' || currentStatus === 'Cold') {
                currentStatus = 'Hot';
              } else if (currentStatus === 'Contacted' || currentStatus === 'Negotiating') {
                currentStatus = 'Warm';
              } else {
                currentStatus = 'Hot'; // fallback
              }
            }
            return { ...lead, status: currentStatus };
          });
          setLeads(normalizedData);
        })
        .catch((err) => {
          console.error(err);
          setLeads([]);
        })
        .finally(() => setLoading(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [profile]);

  // Toast auto-dismissal
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const displayLeads = leads;

  // Filter logic
  const filteredLeads = useMemo(() => {
    return displayLeads.filter(lead => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        lead.client_name?.toLowerCase().includes(q) ||
        lead.email?.toLowerCase().includes(q) ||
        lead.phone?.includes(q) ||
        (lead.preferred_location || '').toLowerCase().includes(q) ||
        (lead.property_type || '').toLowerCase().includes(q) ||
        (lead.configuration || '').toLowerCase().includes(q) ||
        (lead.lead_source_id || '').toLowerCase().includes(q);

      // Status filter (tab-level)
      let matchesStatus = true;
      if (statusFilter === 'today') {
        if (!lead.created_at) matchesStatus = false;
        else {
          const d = new Date(lead.created_at);
          matchesStatus = d.toDateString() === new Date().toDateString();
        }
      } else if (statusFilter !== 'all' && statusFilter !== 'All') {
        matchesStatus = lead.status === statusFilter;
      }

      // Drill-down advanced filters
      const matchesLocation = filterLocations.length === 0 || filterLocations.some(loc => 
        (lead.preferred_location || '').toLowerCase().includes(loc.toLowerCase())
      );
      const matchesPropertyType = !filterPropertyType || lead.property_type === filterPropertyType;
      const matchesConfiguration = !filterConfiguration || lead.configuration === filterConfiguration;
      const matchesSource = !filterSource || lead.lead_source_id === filterSource;
      const matchesTransactionType = !filterTransactionType || lead.transaction_type === filterTransactionType;
      const matchesStage = !filterStage || lead.stage_id === filterStage;

      // Active/Inactive filter
      const matchesActiveState = activeState === 'All' 
        || (activeState === 'Active' && lead.is_active !== false)
        || (activeState === 'Inactive' && lead.is_active === false);

      let matchesBudget = true;
      if (filterBudgetMin) {
        const min = parseFloat(filterBudgetMin);
        if (!isNaN(min)) matchesBudget = (lead.budget_max || 0) >= min;
      }
      if (matchesBudget && filterBudgetMax) {
        const max = parseFloat(filterBudgetMax);
        if (!isNaN(max)) matchesBudget = (lead.budget_min || 0) <= max;
      }

      return matchesSearch && matchesStatus && matchesActiveState && matchesLocation && matchesPropertyType && matchesConfiguration && matchesSource && matchesTransactionType && matchesStage && matchesBudget;
    });
  }, [displayLeads, searchQuery, statusFilter, activeState, filterLocations, filterPropertyType, filterConfiguration, filterSource, filterTransactionType, filterBudgetMin, filterBudgetMax, filterStage]);

  // Sort logic
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "created_at") {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        cmp = timeA - timeB;
      } else {
        cmp = (a.client_name || "").localeCompare(b.client_name || "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredLeads, sortKey, sortDir]);

  // Selection helpers
  const selectedLeads = useMemo(
    () => sortedLeads.filter((lead) => selectedLeadIds.has(lead.id)),
    [sortedLeads, selectedLeadIds],
  );

  const allVisibleSelected = sortedLeads.length > 0 && sortedLeads.every((lead) => selectedLeadIds.has(lead.id));
  const someVisibleSelected = sortedLeads.some((lead) => selectedLeadIds.has(lead.id));

  function toggleVisibleSelection(checked: boolean) {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (checked) sortedLeads.forEach((lead) => next.add(lead.id));
      else sortedLeads.forEach((lead) => next.delete(lead.id));
      return next;
    });
  }

  function toggleLeadSelection(id: string, checked: boolean) {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSort(key: 'created_at' | 'client_name') {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  // Inline DB updates
  const handleRowStatusChange = async (leadId: string, newStatus: string) => {
    // If status is "Closed", auto-move to Inactive. Otherwise, ensure it's Active.
    const shouldDeactivate = newStatus === 'Closed';
    const shouldActivate = newStatus !== 'Closed';
    
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      return { ...l, status: newStatus, is_active: shouldActivate };
    }));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, status: newStatus, is_active: shouldActivate } : null);
    }
    setToast({ msg: shouldDeactivate ? "Lead closed — moved to Inactive." : "Status updated.", tone: "ok" });
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus, is_active: shouldActivate })
        .eq('id', leadId);
      if (error) {
        console.error("Database update error:", error);
        setToast({ msg: `Failed: ${error.message}`, tone: "err" });
      }
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to update status", tone: "err" });
    }
  };

  // Toggle lead active/inactive state
  const handleToggleLeadActive = async (leadId: string, currentState: boolean) => {
    const newState = !currentState;
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, is_active: newState } : l));
    setToast({ msg: newState ? "Lead activated." : "Lead deactivated.", tone: "ok" });
    try {
      const { error } = await supabase
        .from('leads')
        .update({ is_active: newState })
        .eq('id', leadId);
      if (error) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, is_active: currentState } : l));
        setToast({ msg: `Failed: ${error.message}`, tone: "err" });
      }
    } catch (err) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, is_active: currentState } : l));
      setToast({ msg: "Failed to toggle state", tone: "err" });
    }
  };
  const handleRowStageChange = async (leadId: string, newStage: string) => {
    // If stage is set to Closure, auto-deactivate the lead
    const shouldDeactivate = newStage === 'Closure';
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage_id: newStage, ...(shouldDeactivate ? { is_active: false } : {}) } : l));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, stage_id: newStage, ...(shouldDeactivate ? { is_active: false } : {}) } : null);
    }
    setToast({ msg: shouldDeactivate ? "Deal closed — lead marked inactive." : "Stage updated.", tone: "ok" });
    try {
      const updateData: Record<string, unknown> = { stage_id: newStage };
      if (shouldDeactivate) {
        updateData.is_active = false;
        updateData.status = 'Closed';
      }
      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);
      if (error) {
        console.error("Database update error:", error);
        setToast({ msg: `Failed: ${error.message}`, tone: "err" });
      }
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to update stage", tone: "err" });
    }
  };

  const handleRowFollowUpChange = async (leadId: string, date: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, next_followup_date: date || undefined } : l));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, next_followup_date: date } : null);
    }
    setToast({ msg: "Follow-up date updated.", tone: "ok" });
    try {
      const { error } = await supabase
        .from('leads')
        .update({ next_followup_date: date || null })
        .eq('id', leadId);
      if (error) {
        console.error("Database update error:", error);
        setToast({ msg: `Failed: ${error.message}`, tone: "err" });
      }
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to update follow-up", tone: "err" });
    }
  };

  const handleRowNotesChange = async (leadId: string, newNotes: string) => {
    const lead = displayLeads.find(l => l.id === leadId);
    if (lead?.notes === newNotes) return;
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: newNotes } : l));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, notes: newNotes } : null);
      setNoteText(newNotes);
    }
    setToast({ msg: "Notes saved.", tone: "ok" });
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes: newNotes })
        .eq('id', leadId);
      if (error) {
        console.error("Database update error:", error);
        setToast({ msg: `Failed: ${error.message}`, tone: "err" });
      }
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to save notes", tone: "err" });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    setLeads(prev => prev.filter(l => l.id !== leadId));
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      next.delete(leadId);
      return next;
    });
    if (selectedLead && selectedLead.id === leadId) {
      setIsDrawerOpen(false);
      setSelectedLead(null);
    }
    setToast({ msg: "Lead deleted.", tone: "ok" });
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
      if (error) {
        console.error("Database deletion error:", error);
        setToast({ msg: `Failed: ${error.message}`, tone: "err" });
      }
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to delete lead", tone: "err" });
    }
  };

  const bulkDeleteSelected = async () => {
    if (selectedLeadIds.size === 0) return;
    if (!confirm(`Delete ${selectedLeadIds.size} selected lead(s)? This cannot be undone.`)) return;
    
    setBulkDeleting(true);
    const selectedIdsArray = Array.from(selectedLeadIds);
    setLeads(prev => prev.filter(l => !selectedLeadIds.has(l.id)));
    setSelectedLeadIds(new Set());
    setToast({ msg: `${selectedIdsArray.length} leads deleted.`, tone: "ok" });

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', selectedIdsArray);
      if (error) {
        console.error("Database deletion error:", error);
        setToast({ msg: `Failed: ${error.message}`, tone: "err" });
      }
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed bulk deletion", tone: "err" });
    } finally {
      setBulkDeleting(false);
    }
  };

  // CSV Export
  function exportCsv(rowsToExport = sortedLeads) {
    const headers = [
      "Created At",
      "Client Name",
      "Email",
      "Phone",
      "Source",
      "Budget Min",
      "Budget Max",
      "Preferred Location",
      "Property Type",
      "Configuration",
      "Commercial/Residential",
      "Rent/Outright",
      "Status",
      "Stage",
      "Next Followup Date",
      "Notes"
    ];
    const rows = rowsToExport.map((l) =>
      [
        l.created_at || "",
        l.client_name || "",
        l.email || "",
        l.phone || "",
        l.lead_source_id || "",
        l.budget_min || "",
        l.budget_max || "",
        l.preferred_location || "",
        l.property_type || "",
        l.configuration || "",
        l.category || "",
        l.transaction_type || "",
        l.status || "",
        l.stage_id || "",
        l.next_followup_date || "",
        l.notes || ""
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `luxe-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Sharing Helper Functions
  const generateShareText = (l: Lead) => {
    const createdDate = l.created_at ? new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';
    return `📋 *Luxe Realty Lead Details*
👤 *Name:* ${l.client_name}
📞 *Phone:* ${l.phone || 'N/A'}
✉️ *Email:* ${l.email || 'N/A'}
🌐 *Source:* ${l.lead_source_id || 'N/A'}
🏷️ *Status:* ${l.status || 'New'}
📅 *Created:* ${createdDate}
📍 *Location:* ${l.preferred_location || 'Flexible'}
🏢 *Property:* ${l.property_type || 'N/A'} (${l.configuration || 'Any'})
💰 *Budget:* ${l.budget_min ? `${formatBudgetAbbreviated(l.budget_min)} - ${formatBudgetAbbreviated(l.budget_max)}` : 'Flexible'}
💼 *Type:* ${l.transaction_type || 'Outright'} / ${l.category || 'Residential'}
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

  const getShareableUrl = (l: Lead) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/leads/${l.id}`;
    }
    return '';
  };

  const handleBulkShare = (type: 'copy' | 'whatsapp' | 'email') => {
    if (selectedLeads.length === 0) return;
    
    const leadsSummary = selectedLeads.map((l, index) => {
      return `${index + 1}️⃣ *${l.client_name}*
• Budget: ${l.budget_min ? `${formatBudgetAbbreviated(l.budget_min)} - ${formatBudgetAbbreviated(l.budget_max)}` : 'Flexible'}
• Location Pref: ${l.preferred_location || 'Flexible'}
• Property Type: ${l.property_type || 'N/A'} (${l.configuration || 'Any'})
• Notes: ${l.notes || 'None'}`;
    }).join('\n\n');

    const headerText = `📋 *LUXE REALTY - SHARED LEADS SUMMARY (${selectedLeads.length} leads)*\n\n`;
    const fullText = headerText + leadsSummary;

    if (type === 'copy') {
      copyToClipboard(fullText, `${selectedLeads.length} leads details copied!`);
    } else if (type === 'whatsapp') {
      const text = encodeURIComponent(fullText);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    } else if (type === 'email') {
      const subject = encodeURIComponent(`Shared Leads Summary (${selectedLeads.length} leads)`);
      const body = encodeURIComponent(fullText);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
    }
  };

  // Handle lead click to open drawer
  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead);
    setNoteText(lead.notes || '');
    setIsDrawerOpen(true);
  };

  // Drawer update methods (delegates to row methods for single source of truth)
  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedLead) return;
    handleRowStatusChange(selectedLead.id, newStatus);
  };

  const handleSaveNotes = () => {
    if (!selectedLead) return;
    handleRowNotesChange(selectedLead.id, noteText);
  };

  // Color mappings
  const getSourceStyle = (source: string | undefined | null) => {
    const s = source?.toLowerCase() || '';
    if (s.includes('website')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s.includes('referral')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (s.includes('instagram')) return 'bg-pink-50 text-pink-700 border-pink-200';
    if (s.includes('99 acres') || s.includes('99acres')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s.includes('magicbricks') || s.includes('magic bricks')) return 'bg-red-50 text-red-700 border-red-200';
    if (s.includes('walkin') || s.includes('walk in') || s.includes('direct')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-zinc-50 text-zinc-700 border-zinc-200';
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Hot': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Warm': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'No answer': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Not reachable': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Switched off': return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      case 'Closed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-zinc-50 text-zinc-600 border-zinc-200';
    }
  };

  const statusTabs = ['All', 'Hot', 'Warm', 'No answer', 'Not reachable', 'Switched off', 'Closed'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 px-4">
      {/* Page Header Area */}
      <div className="flex flex-col gap-6">
        {/* Leads KPI Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-200/60">
          <div className="p-4 bg-white border border-zinc-200 rounded-xl flex items-center gap-3 shadow-3xs text-left">
            <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-lg text-zinc-600">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Leads</p>
              <p className="text-base font-black text-zinc-900 mt-0.5">{displayLeads.length}</p>
            </div>
          </div>
          <div className="p-4 bg-white border border-zinc-200 rounded-xl flex items-center gap-3 shadow-3xs text-left">
            <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Active Leads</p>
              <p className="text-base font-black text-zinc-900 mt-0.5">{displayLeads.filter(l => l.is_active !== false).length}</p>
            </div>
          </div>
          <div className="p-4 bg-white border border-zinc-200 rounded-xl flex items-center gap-3 shadow-3xs text-left">
            <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Hot Prospects</p>
              <p className="text-base font-black text-zinc-900 mt-0.5">{displayLeads.filter(l => l.status === 'Hot').length}</p>
            </div>
          </div>
          <div className="p-4 bg-white border border-zinc-200 rounded-xl flex items-center gap-3 shadow-3xs text-left">
            <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-lg text-zinc-600">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Closed Deals</p>
              <p className="text-base font-black text-zinc-900 mt-0.5">{displayLeads.filter(l => l.status === 'Closed').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Tabular View */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-white border border-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <TableCard.Root className="overflow-hidden bg-white ring-1 ring-zinc-200 shadow-xs rounded-xl">
          <TableCard.Header 
            title="All leads"
            badge={sortedLeads.length}
            contentTrailing={
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative group shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-zinc-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search leads..." 
                    className="pl-9 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 w-48 transition-all shrink-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm outline-none transition-all hover:border-zinc-300 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 cursor-pointer shrink-0"
                >
                  <option value="all">All statuses</option>
                  <option value="today">Today</option>
                  {statusTabs.slice(1).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 ${
                    showAdvancedFilters 
                      ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800' 
                      : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Drill Down
                  {(filterLocations.length > 0 || filterPropertyType || filterConfiguration || filterSource || filterTransactionType || filterBudgetMin || filterBudgetMax || filterStage) && (
                    <span className="ml-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {[filterLocations.length > 0, filterPropertyType, filterConfiguration, filterSource, filterTransactionType, filterBudgetMin || filterBudgetMax, filterStage].filter(Boolean).length}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-0.5 p-0.5 bg-zinc-100 rounded-lg shrink-0">
                  {(['Active', 'Inactive', 'All'] as const).map((state) => (
                    <button
                      key={state}
                      onClick={() => setActiveState(state)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                        activeState === state 
                          ? state === 'Active' ? 'bg-emerald-500 text-white' 
                            : state === 'Inactive' ? 'bg-zinc-500 text-white'
                            : 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => exportCsv()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-50 transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <Download01 className="h-3.5 w-3.5" />
                  Export
                </button>
              </div>
            }
          />

          {/* Drill Down Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="border-b border-zinc-200 bg-zinc-50/70 px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />
                  Drill Down Filters
                </h3>
                <button
                  onClick={() => {
                    setFilterLocations([]);
                    setFilterPropertyType('');
                    setFilterConfiguration('');
                    setFilterSource('');
                    setFilterTransactionType('');
                    setFilterBudgetMin('');
                    setFilterBudgetMax('');
                    setFilterStage('');
                  }}
                  className="text-[10px] font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Location</label>
                  <button
                    type="button"
                    onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-left outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all min-h-[30px]"
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
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                  >
                    <option value="">All types</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa / Independent House</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Office Space">Office Space</option>
                    <option value="Shop">Shop / Retail</option>
                    <option value="Plot">Plot / Land</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Configuration</label>
                  <select
                    value={filterConfiguration}
                    onChange={(e) => setFilterConfiguration(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                  >
                    <option value="">Any config</option>
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="4 BHK">4 BHK</option>
                    <option value="5+ BHK">5+ BHK</option>
                    <option value="Studio">Studio</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Lead Source</label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                  >
                    <option value="">All sources</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Instagram">Instagram</option>
                    <option value="99 acres">99 Acres</option>
                    <option value="Magicbricks">Magicbricks</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Transaction</label>
                  <select
                    value={filterTransactionType}
                    onChange={(e) => setFilterTransactionType(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                  >
                    <option value="">All types</option>
                    <option value="Outright">Outright (Buy)</option>
                    <option value="Rent">Rent / Lease</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Stage</label>
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                  >
                    <option value="">All stages</option>
                    <option value="New inquiry">New inquiry</option>
                    <option value="Site visit">Site visit</option>
                    <option value="Follow up">Follow up</option>
                    <option value="Closure">Closure</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Budget Min (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000000"
                    value={filterBudgetMin}
                    onChange={(e) => setFilterBudgetMin(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Budget Max (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000000"
                    value={filterBudgetMax}
                    onChange={(e) => setFilterBudgetMax(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Old Bulk Action Bar removed */}

          <div className="w-full">
            <Table size="sm" aria-label="Leads">
              <Table.Header>
                <Table.Head className="w-10 text-center">
                  <button
                    type="button"
                    aria-label="Select all leads"
                    onClick={() => toggleVisibleSelection(!allVisibleSelected)}
                    className="inline-flex items-center justify-center rounded outline-none"
                  >
                    <CheckboxBase 
                      size="sm" 
                      isSelected={allVisibleSelected} 
                      isIndeterminate={!allVisibleSelected && someVisibleSelected} 
                      className={cx("transition-colors", !allVisibleSelected && !someVisibleSelected && "bg-white! ring-zinc-300!")}
                    />
                  </button>
                </Table.Head>
                <Table.Head isRowHeader className="text-xs font-semibold uppercase tracking-wide text-zinc-500 text-left">Name</Table.Head>
                <Table.Head className="text-xs font-semibold uppercase tracking-wide text-zinc-500 text-left">Email</Table.Head>
                <Table.Head className="text-xs font-semibold uppercase tracking-wide text-zinc-500 text-left">Phone</Table.Head>
                <Table.Head className="text-xs font-semibold uppercase tracking-wide text-zinc-500 text-left">Source</Table.Head>
                <Table.Head className="text-xs font-semibold uppercase tracking-wide text-zinc-500 text-left">Config</Table.Head>
                <Table.Head className="text-xs font-semibold uppercase tracking-wide text-zinc-500 text-left">Location</Table.Head>
                <Table.Head className="text-xs font-semibold uppercase tracking-wide text-zinc-500 text-left">Status</Table.Head>
                <Table.Head className="w-24 text-xs font-semibold uppercase tracking-wide text-zinc-500 text-center">Actions</Table.Head>
              </Table.Header>
              <Table.Body>
                {sortedLeads.map((lead) => (
                  <Table.Row 
                    key={lead.id} 
                    onClick={() => handleOpenLead(lead)} 
                    className="cursor-pointer hover:bg-zinc-50/70 transition-colors group/row"
                  >
                    {/* Checkbox */}
                    <Table.Cell className="w-10 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        aria-label={`Select ${lead.client_name}`}
                        onClick={() => toggleLeadSelection(lead.id, !selectedLeadIds.has(lead.id))}
                        className="inline-flex items-center justify-center rounded outline-none"
                      >
                        <CheckboxBase 
                          size="sm" 
                          isSelected={selectedLeadIds.has(lead.id)} 
                          className={cx("transition-colors", !selectedLeadIds.has(lead.id) && "bg-white! ring-zinc-300!")}
                        />
                      </button>
                    </Table.Cell>

                    {/* Name */}
                    <Table.Cell className="text-left">
                      <div className="flex items-center gap-2">
                        <div className="relative h-6 w-6 rounded-md bg-zinc-100 text-zinc-700 font-extrabold flex items-center justify-center text-[10px]">
                          {lead.client_name ? lead.client_name.split(' ').map(n => n[0]).join('') : '?'}
                          <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white ${
                            lead.status === 'Hot' ? 'bg-rose-500' :
                            lead.status === 'Warm' ? 'bg-amber-500' :
                            lead.status === 'Closed' ? 'bg-zinc-400' :
                            'bg-zinc-300'
                          }`} />
                        </div>
                        <span className="text-xs font-bold text-zinc-900 truncate max-w-[140px]">{lead.client_name}</span>
                      </div>
                    </Table.Cell>

                    {/* Email */}
                    <Table.Cell className="text-left">
                      <span className="text-xs text-zinc-600 truncate max-w-[180px] block">{lead.email || '—'}</span>
                    </Table.Cell>

                    {/* Phone */}
                    <Table.Cell className="text-left">
                      <span className="text-xs font-medium text-zinc-700">{lead.phone || '—'}</span>
                    </Table.Cell>

                    {/* Source */}
                    <Table.Cell className="text-left">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getSourceStyle(lead.lead_source_id)}`}>
                        {lead.lead_source_id || '—'}
                      </span>
                    </Table.Cell>

                    {/* Config */}
                    <Table.Cell className="text-left">
                      <span className="text-xs font-medium text-zinc-700">{lead.configuration || '—'}</span>
                    </Table.Cell>

                    {/* Location */}
                    <Table.Cell className="text-left">
                      <span className="text-xs text-zinc-600 truncate max-w-[140px] block">{lead.preferred_location || '—'}</span>
                    </Table.Cell>

                    {/* Status */}
                    <Table.Cell className="text-left" onClick={(e) => e.stopPropagation()}>
                      <div className="relative w-28">
                        <select
                          value={lead.status || "Hot"}
                          onChange={(e) => handleRowStatusChange(lead.id, e.target.value)}
                          className={cx(
                            "w-full cursor-pointer rounded-lg border pl-2 pr-6 py-1 text-[11px] font-semibold shadow-sm outline-none transition-all focus:ring-2 focus:ring-zinc-500/20 appearance-none text-left",
                            getStatusStyle(lead.status || "Hot")
                          )}
                        >
                          {['Hot', 'Warm', 'No answer', 'Not reachable', 'Switched off', 'Closed'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-60" />
                      </div>
                    </Table.Cell>

                    {/* Actions */}
                    <Table.Cell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenLead(lead)}
                          className="rounded-lg px-3 py-1.5 border border-zinc-200 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 transition-colors shadow-xs cursor-pointer"
                          title="View Details"
                        >
                          View
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors border border-zinc-200 bg-white shadow-xs">
                              <Share2 className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border border-zinc-200 rounded-xl shadow-lg p-1 z-30">
                            <DropdownMenuItem onClick={() => copyToClipboard(generateShareText(lead), "Lead details copied!")} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                              <Copy className="h-3.5 w-3.5 text-zinc-400" />
                              Copy details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => shareWhatsApp(lead)} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                              <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                              WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => shareEmail(lead)} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                              <Mail className="h-3.5 w-3.5 text-zinc-400" />
                              Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
          {sortedLeads.length === 0 && (
            <div className="px-6 py-12 text-center text-xs font-semibold text-zinc-400">
              No leads found matching query or filters.
            </div>
          )}
        </TableCard.Root>
      )}

      {/* Lead Details Slide-out Drawer */}
      {isDrawerOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-zinc-900/20">
                  {selectedLead.client_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">{selectedLead.client_name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest border transition-all ${getStatusStyle(selectedLead.status || 'Hot')}`}>
                      {selectedLead.status || 'Hot'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">Added {new Date(selectedLead.created_at || '').toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors bg-white border border-zinc-100 shadow-sm">
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>

            {/* Drawer Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Contact Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <a 
                  href={`tel:${selectedLead.phone}`}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 border border-zinc-200/80 transition-all"
                >
                  <Phone className="h-4 w-4 text-zinc-500" />
                  Call Now
                </a>
                <a 
                  href={`mailto:${selectedLead.email}`}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all shadow-md"
                >
                  <Mail className="h-4 w-4 text-zinc-400" />
                  Send Email
                </a>
              </div>

              {/* Quick Status Selection */}
              <div className="space-y-3 bg-zinc-50 border border-zinc-200/60 p-4 rounded-2xl">
                <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Quick Update Status
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Hot', 'Warm', 'No answer', 'Not reachable', 'Switched off', 'Closed'].map((statusOption) => (
                    <button
                      key={statusOption}
                      onClick={() => handleUpdateStatus(statusOption)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        selectedLead.status === statusOption
                          ? getStatusStyle(statusOption) + ' border-zinc-400'
                          : 'bg-white text-zinc-500 hover:text-zinc-900 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      {statusOption}
                    </button>
                  ))}
                </div>
              </div>

              {/* Requirement Summary */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-[0.15em] flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5" />
                  Client Requirement
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Budget Max</p>
                    <p className="text-sm font-bold text-zinc-900">
                      {selectedLead.budget_max ? formatBudgetAbbreviated(selectedLead.budget_max) : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Configuration</p>
                    <p className="text-sm font-bold text-zinc-900">{selectedLead.configuration || 'Any'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Location Pref</p>
                    <p className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                      {selectedLead.preferred_location || 'Flexible'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Property Type</p>
                    <p className="text-sm font-bold text-zinc-900">{selectedLead.property_type || 'Residential'}</p>
                  </div>
                </div>
              </div>

              {/* Engagement Timeline / Notes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Interaction Notes
                  </h3>
                  <button 
                    onClick={handleSaveNotes}
                    className="text-[10px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors border border-zinc-200 px-3 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50"
                  >
                    Save Notes
                  </button>
                </div>
                
                <textarea 
                  className="w-full h-32 p-4 rounded-2xl border border-zinc-200 text-sm font-medium focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 outline-none transition-all resize-none bg-zinc-50/30"
                  placeholder="Update lead progress, concerns, or next steps..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>

              {/* Lead Source */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Acquisition Channel</p>
                  <p className="text-xs font-bold text-zinc-900">{selectedLead.lead_source_id || 'Direct Inquiry'}</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-zinc-100 shadow-sm">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex flex-wrap items-center gap-2">
              <Link href={`/leads/edit?id=${selectedLead.id}`} className="flex-1 min-w-[120px]">
                <button className="w-full py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs font-bold hover:bg-zinc-50 transition-all flex items-center justify-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex-1 min-w-[120px] py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs font-bold hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <Share2 className="h-4 w-4 text-zinc-500" />
                    Share Lead
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border border-zinc-200 rounded-xl shadow-lg p-1 z-[60]">
                  <DropdownMenuItem onClick={() => copyToClipboard(generateShareText(selectedLead), "Lead details copied!")} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                    <Copy className="h-3.5 w-3.5 text-zinc-400" />
                    Copy details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyToClipboard(getShareableUrl(selectedLead), "Shareable link copied!")} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareWhatsApp(selectedLead)} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                    Share to WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareEmail(selectedLead)} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    Share via Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setQrLead(selectedLead); setIsQrOpen(true); }} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                    <QrCode className="h-3.5 w-3.5 text-zinc-400" />
                    Show QR code
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button 
                onClick={() => handleUpdateStatus('Closed')}
                className="flex-1 min-w-[120px] py-3.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10"
              >
                <CheckCircle className="h-4 w-4" />
                Mark as Closed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal Integration */}
      <QRCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={qrLead ? getShareableUrl(qrLead) : ''}
        title={qrLead ? `Scan to view ${qrLead.client_name}'s requirements` : ''}
      />

      {/* Floating Bulk Action Dock */}
      {selectedLeadIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-950 text-white rounded-2xl shadow-2xl border border-zinc-800 px-5 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2.5 shrink-0 border-r border-zinc-800 pr-5">
            <span className="h-5 w-5 rounded-full bg-zinc-800 text-white text-[10px] font-black flex items-center justify-center">
              {selectedLeadIds.size}
            </span>
            <span className="text-[11px] font-bold tracking-wide uppercase text-zinc-400">Leads Selected</span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => exportCsv(selectedLeads)}
              className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-bold hover:bg-zinc-800 hover:text-white transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Download01 className="h-3.5 w-3.5 text-zinc-400" />
              Export
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-bold hover:bg-zinc-800 hover:text-white transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer">
                  <Share2 className="h-3.5 w-3.5 text-zinc-500" />
                  Share
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-zinc-950 border border-zinc-800 text-white rounded-xl shadow-2xl p-1 z-50">
                <DropdownMenuItem onClick={() => handleBulkShare('copy')} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-zinc-900">
                  <Copy className="h-3.5 w-3.5 text-zinc-550" />
                  Copy Summary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkShare('whatsapp')} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-zinc-900">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                  Share to WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkShare('email')} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-zinc-900">
                  <Mail className="h-3.5 w-3.5 text-zinc-550" />
                  Share via Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={bulkDeleteSelected}
              disabled={bulkDeleting}
              className="px-3.5 py-2 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-xl text-xs font-bold hover:bg-rose-900 hover:text-white transition-all shadow-xs disabled:opacity-50 shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {bulkDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>

          <button 
            onClick={() => setSelectedLeadIds(new Set())}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={cx(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ring-1 transition-all bg-white",
            toast.tone === "ok" ? "text-emerald-700 ring-emerald-200" : "text-red-700 ring-red-200"
          )}
        >
          <span
            className={cx(
              "h-2 w-2 rounded-full",
              toast.tone === "ok" ? "bg-emerald-500" : "bg-red-500"
            )}
          />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
