"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useProfile } from '@/lib/auth';
import { fetchLeads, Lead } from '@/lib/queries';
import { getPermissions } from '@/lib/permissions';
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
import { AvatarCell } from '@/components/ui/AvatarCell';
import { InlineStatsBar } from '@/components/ui/InlineStatsBar';
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
  const perms = getPermissions(profile?.role);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive UI state
  const [salesExecutives, setSalesExecutives] = useState<any[]>([]);
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

      // Fetch Sales Executives
      supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'SalesPerson')
        .then(({ data }) => {
          setSalesExecutives(data || []);
        });

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
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, is_active: newState } : null);
    }
    setToast({ msg: newState ? "Lead activated." : "Lead deactivated.", tone: "ok" });
    try {
      const { error } = await supabase
        .from('leads')
        .update({ is_active: newState })
        .eq('id', leadId);
      if (error) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, is_active: currentState } : l));
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(prev => prev ? { ...prev, is_active: currentState } : null);
        }
        setToast({ msg: `Failed: ${error.message}`, tone: "err" });
      }
    } catch (err) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, is_active: currentState } : l));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, is_active: currentState } : null);
      }
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
    const budgetStr = l.budget_min
      ? `${formatBudgetAbbreviated(l.budget_min)} - ${formatBudgetAbbreviated(l.budget_max)}`
      : 'Flexible';
    return `LUXE REALTY PUNE - LEAD DETAILS

Name: ${l.client_name}
Phone: ${l.phone || 'N/A'}
Email: ${l.email || 'N/A'}
Source: ${l.lead_source_id || 'N/A'}
Status: ${l.status || 'New'}
Created: ${createdDate}

Location Preference: ${l.preferred_location || 'Flexible'}
Property Type: ${l.property_type || 'N/A'} (${l.configuration || 'Any'})
Budget: ${budgetStr}
Transaction: ${l.transaction_type || 'Outright'} / ${l.category || 'Residential'}

Notes: ${l.notes || 'None'}`;
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
      const budgetStr = l.budget_min
        ? `${formatBudgetAbbreviated(l.budget_min)} - ${formatBudgetAbbreviated(l.budget_max)}`
        : 'Flexible';
      return `${index + 1}. ${l.client_name}
   Phone: ${l.phone || 'N/A'}
   Email: ${l.email || 'N/A'}
   Source: ${l.lead_source_id || 'N/A'}
   Status: ${l.status || 'New'}
   Location: ${l.preferred_location || 'Flexible'}
   Property: ${l.property_type || 'N/A'} (${l.configuration || 'Any'})
   Budget: ${budgetStr}
   Transaction: ${l.transaction_type || 'Outright'} / ${l.category || 'Residential'}
   Notes: ${l.notes || 'None'}`;
    }).join('\n\n');

    // No repeated-character divider here -- a fixed-width line (e.g. 40 dashes) wraps
    // across 2-3 visual lines in WhatsApp's narrow message bubble instead of staying on
    // one, which is what showed up as extra blank-looking lines under the header.
    const headerText = `LUXE REALTY PUNE - SHARED LEADS SUMMARY (${selectedLeads.length} Lead${selectedLeads.length > 1 ? 's' : ''})\n\n`;
    const fullText = headerText + leadsSummary;

    if (type === 'copy') {
      copyToClipboard(fullText, `${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} copied!`);
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

  const inlineStats = useMemo(() => [
    { label: 'Total Leads', count: displayLeads.length, colorClass: 'bg-zinc-400' },
    { label: 'Active Leads', count: displayLeads.filter(l => l.is_active !== false).length, colorClass: 'bg-emerald-500' },
    { label: 'Hot Prospects', count: displayLeads.filter(l => l.status === 'Hot').length, colorClass: 'bg-rose-500' },
    { label: 'Warm Leads', count: displayLeads.filter(l => l.status === 'Warm').length, colorClass: 'bg-amber-500' },
    { label: 'Closed Deals', count: displayLeads.filter(l => l.status === 'Closed').length, colorClass: 'bg-zinc-650' }
  ], [displayLeads]);

  return (
    <div className="w-full pb-20 text-zinc-900 text-left">
      {/* Unified Direction C Frame — header + stats + toolbar + table all in one card */}
      <div className="overflow-hidden bg-white border border-[#e8e7e4] rounded-2xl shadow-sm">

        {/* Editorial Header — inside the card */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 px-6 py-5 border-b border-[#ebebeb]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-extrabold tracking-tight text-zinc-900" style={{ letterSpacing: '-0.4px' }}>Leads Database</h1>
              <span className="bg-zinc-900 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                {sortedLeads.length}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">All client enquiries · Luxe Realty Pune</p>
          </div>
          {/* Header actions: Export + New Lead */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportCsv()}
              className="dc-btn font-semibold flex items-center gap-1.5"
            >
              <Download01 className="h-3.5 w-3.5" />
              Export
            </button>
            <Link href="/leads/create">
              <button className="dc-btn gold font-bold flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                New Lead
              </button>
            </Link>
          </div>
        </div>

        {/* Inline Stats Bar — glued directly under header */}
        <InlineStatsBar stats={inlineStats} />

        {/* Loading skeleton or table */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-12 bg-zinc-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
          {/* Porcelain Unified Toolbar */}
          <div className="dc-toolbar">
            {/* Search Input */}
            <div className="dc-search-container">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search leads..." 
                className="dc-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Dropdown Filter */}
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="dc-btn font-semibold cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="today">Today</option>
              {statusTabs.slice(1).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
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
              {(filterLocations.length > 0 || filterPropertyType || filterConfiguration || filterSource || filterTransactionType || filterBudgetMin || filterBudgetMax || filterStage) && (
                <span className="ml-1 h-4 w-4 rounded-full bg-zinc-700 text-white text-[9px] font-bold flex items-center justify-center">
                  {[filterLocations.length > 0, filterPropertyType, filterConfiguration, filterSource, filterTransactionType, filterBudgetMin || filterBudgetMax, filterStage].filter(Boolean).length}
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
          </div>

          {/* Drill Down Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="border-b border-[#e8e7e4] bg-[#fcfcfa] px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
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
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Location</label>
                  <button
                    type="button"
                    onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-left outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all min-h-[30px]"
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
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Property Type</label>
                  <select
                    value={filterPropertyType}
                    onChange={(e) => setFilterPropertyType(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
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
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Configuration</label>
                  <select
                    value={filterConfiguration}
                    onChange={(e) => setFilterConfiguration(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                  >
                    <option value="">Any config</option>
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="2.5 BHK">2.5 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="3.5 BHK">3.5 BHK</option>
                    <option value="4 BHK">4 BHK</option>
                    <option value="4.5 BHK">4.5 BHK</option>
                    <option value="5 BHK">5 BHK</option>
                    <option value="5.5 BHK">5.5 BHK</option>
                    <option value="6 BHK">6 BHK</option>
                    <option value="6.5 BHK">6.5 BHK</option>
                    <option value="Studio">Studio</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Lead Source</label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
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
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Transaction</label>
                  <select
                    value={filterTransactionType}
                    onChange={(e) => setFilterTransactionType(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                  >
                    <option value="">All types</option>
                    <option value="Outright">Outright (Buy)</option>
                    <option value="Rent">Rent / Lease</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Stage</label>
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                  >
                    <option value="">All stages</option>
                    <option value="New inquiry">New inquiry</option>
                    <option value="Site visit">Site visit</option>
                    <option value="Follow up">Follow up</option>
                    <option value="Closure">Closure</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Budget Min (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000000"
                    value={filterBudgetMin}
                    onChange={(e) => setFilterBudgetMin(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Budget Max (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000000"
                    value={filterBudgetMax}
                    onChange={(e) => setFilterBudgetMax(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notion Style Table Container */}
          <div className="dc-table-container">
            <table className="dc-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }} className="text-center">
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
                  </th>
                  <th>Name & Contact</th>
                  <th>Source</th>
                  <th>Config</th>
                  <th>Location</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Stage</th>
                  <th style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    onClick={() => handleOpenLead(lead)} 
                    className="cursor-pointer group/row"
                  >
                    {/* Checkbox */}
                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
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
                    </td>

                    {/* Name & Contact combined using AvatarCell */}
                    <td>
                      <AvatarCell 
                        name={lead.client_name || 'No Name'} 
                        subtext={lead.phone || lead.email || 'No contact details'} 
                      />
                    </td>

                    {/* Source */}
                    <td>
                      <span className={`dc-badge ${getSourceStyle(lead.lead_source_id)}`}>
                        {lead.lead_source_id || '—'}
                      </span>
                    </td>

                    {/* Config */}
                    <td className="font-semibold text-zinc-900 text-xs">
                      {lead.configuration || '—'}
                    </td>

                    {/* Location */}
                    <td className="text-zinc-500 font-medium text-xs max-w-[150px] truncate">
                      {lead.preferred_location || '—'}
                    </td>

                    {/* Assigned To */}
                    <td onClick={(e) => e.stopPropagation()}>
                      {perms.canViewAllLeads ? (
                        <div className="relative">
                          <select
                            aria-label="Assign executive"
                            value={lead.assigned_to || ""}
                            onChange={async (e) => {
                              const newAssignee = e.target.value;
                              setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, assigned_to: newAssignee || undefined } : l));
                              try {
                                await supabase
                                  .from('leads')
                                  .update({ assigned_to: newAssignee || null })
                                  .eq('id', lead.id);
                              } catch (err) {
                                console.error('Error updating assignee:', err);
                              }
                            }}
                            className="bg-transparent hover:bg-zinc-50 border border-transparent hover:border-zinc-200 rounded-md px-1.5 py-0.5 text-xs text-zinc-700 font-semibold transition-all focus:outline-none focus:border-[#d4ad4d] cursor-pointer"
                          >
                            <option value="">Unassigned</option>
                            {salesExecutives.map(exec => (
                              <option key={exec.id} value={exec.id}>{exec.full_name}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-[10px] font-semibold text-zinc-600 inline-block w-36 truncate text-center">
                          {salesExecutives.find(x => x.id === lead.assigned_to)?.full_name || 'Unassigned'}
                        </span>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="relative group/status">
                        <select
                          aria-label="Lead status"
                          value={lead.status || "Hot"}
                          onChange={(e) => handleRowStatusChange(lead.id, e.target.value)}
                          className={cx(
                            "cursor-pointer rounded-md border border-transparent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider outline-none transition-all focus:ring-1 focus:ring-[#d4ad4d]/40 appearance-none text-left",
                            getStatusStyle(lead.status || "Hot")
                          )}
                        >
                          {['Hot', 'Warm', 'No answer', 'Not reachable', 'Switched off', 'Closed'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Stage — plain text label, becomes select on hover/click */}
                    <td onClick={(e) => e.stopPropagation()} className="group/stage">
                      <div className="relative">
                        {/* Visible label */}
                        <span className="text-[9.5px] font-semibold text-zinc-400 group-hover/stage:opacity-0 transition-opacity pointer-events-none absolute inset-0 flex items-center">
                          {lead.stage_id || 'New inquiry'}
                        </span>
                        {/* Hover-reveal select */}
                        <select
                          aria-label="Lead stage"
                          value={lead.stage_id || "New inquiry"}
                          onChange={(e) => handleRowStageChange(lead.id, e.target.value)}
                          className="opacity-0 group-hover/stage:opacity-100 bg-white border border-zinc-200 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700 transition-all focus:outline-none focus:border-[#d4ad4d] cursor-pointer w-full"
                        >
                          {['New inquiry', 'Site visit', 'Follow up', 'Closure'].map((stg) => (
                            <option key={stg} value={stg}>{stg}</option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Actions — gold View → text + icon share */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenLead(lead)}
                          className="text-[10.5px] font-bold text-[#d4ad4d] hover:text-[#b8922e] transition-colors whitespace-nowrap"
                        >
                          View →
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sortedLeads.length === 0 && (
            <div className="px-6 py-12 text-center text-xs font-semibold text-zinc-400">
              No leads found matching query or filters.
            </div>
          )}
          </>
        )}
      </div>

      {/* Lead Details Slide-out Drawer */}
      {isDrawerOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-[420px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Gold band at top - Direction C signature */}
            <div className="h-1" style={{background: 'linear-gradient(90deg, #d4ad4d, #e8c96e, #d4ad4d)'}} />
            
            {/* Hero identity block */}
            <div className="px-5 py-4 border-b border-[#ebebeb]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Color-coded avatar */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-extrabold shrink-0"
                    style={{background:'#fde8e8', color:'#c0392b'}}>
                    {selectedLead.client_name?.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-[15px] font-extrabold text-zinc-900 tracking-tight" style={{letterSpacing:'-0.3px'}}>
                      {selectedLead.client_name}
                    </h2>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {selectedLead.phone}{selectedLead.email ? ` · ${selectedLead.email}` : ''}
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors">
                  <X className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
              {/* Status badges row */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${getStatusStyle(selectedLead.status || 'Hot')}`}>
                  {selectedLead.status || 'Hot'}
                </span>
                <button
                  onClick={() => handleToggleLeadActive(selectedLead.id, selectedLead.is_active !== false)}
                  className={cx(
                    'px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border cursor-pointer transition-all',
                    selectedLead.is_active !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
                      : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100'
                  )}
                >
                  {selectedLead.is_active !== false ? 'Active' : 'Inactive'}
                </button>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-50 text-zinc-500 border border-zinc-200 uppercase tracking-wider">
                  {selectedLead.stage_id || 'New Inquiry'}
                </span>
                <span className="text-[9.5px] text-zinc-300 font-medium ml-auto">
                  {new Date(selectedLead.created_at || '').toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}
                </span>
              </div>
            </div>
            
            {/* Quick action bar - 4 buttons */}
            <div className="grid grid-cols-4 gap-0 border-b border-[#ebebeb]">
              <a href={`tel:${selectedLead.phone}`}
                className="flex flex-col items-center gap-1 py-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                <Phone className="h-4 w-4" />
                <span className="text-[9px] font-bold">Call</span>
              </a>
              <button onClick={() => shareWhatsApp(selectedLead)}
                className="flex flex-col items-center gap-1 py-3 text-emerald-600 hover:bg-emerald-50 transition-colors">
                <MessageSquare className="h-4 w-4" />
                <span className="text-[9px] font-bold">WhatsApp</span>
              </button>
              <a href={`mailto:${selectedLead.email}`}
                className="flex flex-col items-center gap-1 py-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                <Mail className="h-4 w-4" />
                <span className="text-[9px] font-bold">Email</span>
              </a>
              <button onClick={() => copyToClipboard(generateShareText(selectedLead), 'Copied!')}
                className="flex flex-col items-center gap-1 py-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                <Copy className="h-4 w-4" />
                <span className="text-[9px] font-bold">Copy</span>
              </button>
            </div>
            
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              
              {/* Inline status update */}
              <div className="px-5 py-3 border-b border-[#f5f5f3]">
                <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.12em] mb-2">Update Status</div>
                <div className="flex flex-wrap gap-1.5">
                  {['Hot','Warm','No answer','Not reachable','Switched off','Closed'].map((s) => (
                    <button key={s} type="button"
                      onClick={() => handleUpdateStatus(s)}
                      className={`px-3 py-1 rounded-full text-[9.5px] font-bold border transition-all ${
                        selectedLead.status === s
                          ? getStatusStyle(s)
                          : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300 hover:text-zinc-700'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Classification - key-value */}
              <div className="px-5 py-3 border-b border-[#f5f5f3]">
                <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.12em] mb-3">Classification</div>
                <div className="space-y-2">
                  {[
                    ['Source', selectedLead.lead_source_id || '—'],
                    ['Category', selectedLead.category || '—'],
                    ['Transaction', selectedLead.transaction_type || '—'],
                    ['Stage', selectedLead.stage_id || 'New inquiry'],
                    ['Assigned To', salesExecutives.find(x => x.id === selectedLead.assigned_to)?.full_name || 'Unassigned'],
                  ].map(([k,v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-zinc-400">{k}</span>
                      <span className="text-[10px] font-bold text-zinc-700">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Requirements - key-value */}
              <div className="px-5 py-3 border-b border-[#f5f5f3]">
                <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.12em] mb-3">Requirements</div>
                <div className="space-y-2">
                  {[
                    ['Type', selectedLead.property_type || '—'],
                    ['Config', selectedLead.configuration || '—'],
                    ['Locations', selectedLead.preferred_location || 'Flexible'],
                    ['Max Budget', selectedLead.budget_max ? formatBudgetAbbreviated(selectedLead.budget_max) : '—'],
                  ].map(([k,v]) => (
                    <div key={k} className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-semibold text-zinc-400 shrink-0">{k}</span>
                      <span className={`text-[10px] font-bold text-right ${
                        k === 'Max Budget' ? 'text-[#d4ad4d]' : 'text-zinc-700'
                      }`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Notes */}
              <div className="px-5 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-[0.12em]">Interaction Notes</div>
                  <button onClick={handleSaveNotes}
                    className="text-[9.5px] font-bold text-zinc-500 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-2.5 py-1 rounded-lg transition-colors">
                    Save
                  </button>
                </div>
                <textarea
                  className="w-full h-28 p-3 border border-[#e8e7e4] rounded-xl text-[11px] font-medium text-zinc-700 placeholder-zinc-300 bg-[#fafaf8] focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 resize-none transition-all"
                  placeholder="Update progress, concerns, or next steps..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-5 py-3 border-t border-[#ebebeb] flex items-center gap-2">
              <Link href={`/leads/edit?id=${selectedLead.id}`} className="flex-1">
                <button className="w-full py-2.5 rounded-xl border border-[#e8e7e4] bg-white text-zinc-700 text-[11px] font-bold hover:bg-zinc-50 transition-all flex items-center justify-center gap-1.5">
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Lead
                </button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="py-2.5 px-4 rounded-xl border border-[#e8e7e4] bg-white text-zinc-700 text-[11px] font-bold hover:bg-zinc-50 transition-all flex items-center gap-1.5 cursor-pointer">
                    <Share2 className="h-3.5 w-3.5 text-zinc-400" />
                    Share
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border border-zinc-200 rounded-xl shadow-lg p-1 z-[60]">
                  <DropdownMenuItem onClick={() => copyToClipboard(generateShareText(selectedLead), 'Copied!')} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                    <Copy className="h-3.5 w-3.5 text-zinc-400" /> Copy details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyToClipboard(getShareableUrl(selectedLead), 'Link copied!')} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400" /> Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareWhatsApp(selectedLead)} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareEmail(selectedLead)} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" /> Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setQrLead(selectedLead); setIsQrOpen(true); }} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                    <QrCode className="h-3.5 w-3.5 text-zinc-400" /> QR code
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={() => handleUpdateStatus('Closed')}
                className="py-2.5 px-4 rounded-xl bg-zinc-900 text-white text-[11px] font-bold hover:bg-zinc-800 transition-all flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                Close
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
