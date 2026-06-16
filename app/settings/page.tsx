"use client";

import React, { useState, useEffect } from 'react';
import { fetchSetting, updateSetting } from '@/lib/queries';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Globe,
  ChevronRight,
  Save,
  Camera,
  Eye,
  EyeOff,
  Check,
  Mail,
  Phone,
  Building2
} from 'lucide-react';

type SettingSection = 'profile' | 'notifications' | 'security' | 'appearance' | 'integrations';

const sections: { id: SettingSection; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Manage your identity and personal details.' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure alerts and notification preferences.' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Passwords, 2FA, and access control settings.' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme, layout, and display preferences.' },
  { id: 'integrations', label: 'Integrations', icon: Database, description: 'Connect third-party tools and data sources.' },
];

const notifOptions = [
  { id: 'new_lead', label: 'New Lead Assigned', description: 'Get notified when a new lead is assigned to you.', defaultOn: true },
  { id: 'deal_update', label: 'Deal Stage Updates', description: 'Alerts when a deal moves through the pipeline.', defaultOn: true },
  { id: 'site_visit', label: 'Site Visit Reminders', description: '1-hour reminder before scheduled property tours.', defaultOn: true },
  { id: 'report_ready', label: 'Monthly Reports', description: 'Email digest of your monthly performance report.', defaultOn: false },
  { id: 'team_activity', label: 'Team Activity Feed', description: 'Notifications about your team\'s CRM activity.', defaultOn: false },
  { id: 'marketing', label: 'Platform Updates', description: 'Product updates, new features, and changelogs.', defaultOn: false },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');

  // Profile form state
  const [fullName, setFullName] = useState('David Thompson');
  const [email, setEmail] = useState('david@luxerealty.com');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [role, setRole] = useState('Senior Agent');
  const [agency, setAgency] = useState('Luxe Realty');
  const [bio, setBio] = useState('Luxury real estate specialist with 8+ years of experience in high-value residential and commercial properties across California.');
  const [profileSaved, setProfileSaved] = useState(false);

  // Security state
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  // Notification toggles
  const [notifStates, setNotifStates] = useState<Record<string, boolean>>(
    Object.fromEntries(notifOptions.map(n => [n.id, n.defaultOn]))
  );

  // Integrations state
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [integrationsSaved, setIntegrationsSaved] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setLoadingSettings(true);
      try {
        const url = await fetchSetting('apps_script_url');
        setAppsScriptUrl(url || '');
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleSaveIntegrations = async () => {
    try {
      await updateSetting('apps_script_url', appsScriptUrl);
      setIntegrationsSaved(true);
      setTimeout(() => setIntegrationsSaved(false), 2000);
    } catch (error) {
      console.error('Error saving integrations:', error);
      alert('Failed to save integration settings.');
    }
  };

  const toggleNotif = (id: string) => {
    setNotifStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const inputClass = "w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all";
  const labelClass = "text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-zinc-900">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-500" />
          Settings
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Manage your account preferences, security, and system integrations.
        </p>
      </div>

      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Sidebar Nav */}
        <div className="lg:col-span-3">
          <nav className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-2 space-y-1">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-600' : 'text-zinc-400'}`} />
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold leading-none">{s.label}</p>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-500' : 'text-zinc-300'}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-9 space-y-5">

          {/* ── PROFILE SECTION ── */}
          {activeSection === 'profile' && (
            <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-100">
                <h2 className="text-sm font-bold text-zinc-800">Profile Information</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">Update your personal details and agent profile.</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center font-black text-2xl text-emerald-600">
                      D
                    </div>
                    <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-white border border-zinc-200 shadow-sm flex items-center justify-center hover:bg-zinc-50 transition-colors">
                      <Camera className="h-3 w-3 text-zinc-500" />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-800">{fullName}</p>
                    <p className="text-xs text-zinc-500">{role} • {agency}</p>
                    <button className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 mt-1 transition-colors">Change photo</button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Role / Title</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Agency / Brokerage</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="text"
                        value={agency}
                        onChange={(e) => setAgency(e.target.value)}
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Bio / About</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className={`${inputClass} resize-none h-24`}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      profileSaved
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                    }`}
                  >
                    {profileSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                    {profileSaved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS SECTION ── */}
          {activeSection === 'notifications' && (
            <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-100">
                <h2 className="text-sm font-bold text-zinc-800">Notification Preferences</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">Choose which alerts you receive and how you receive them.</p>
              </div>
              <div className="divide-y divide-zinc-100">
                {notifOptions.map((opt) => (
                  <div key={opt.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-zinc-800">{opt.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{opt.description}</p>
                    </div>
                    <button
                      onClick={() => toggleNotif(opt.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors cursor-pointer ${
                        notifStates[opt.id]
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-zinc-200 border-zinc-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform mt-px ${
                          notifStates[opt.id] ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SECURITY SECTION ── */}
          {activeSection === 'security' && (
            <div className="space-y-5">
              {/* Change Password */}
              <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100">
                  <h2 className="text-sm font-bold text-zinc-800">Change Password</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Keep your account secure with a strong password.</p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat new password"
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-2">
                      <Save className="h-3.5 w-3.5" />
                      Update Password
                    </button>
                  </div>
                </div>
              </div>

              {/* Two-Factor Auth */}
              <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-800">Two-Factor Authentication (2FA)</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Add a layer of security using an authenticator app.</p>
                  <span className={`inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded border ${
                    twoFAEnabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                  }`}>
                    {twoFAEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <button
                  onClick={() => setTwoFAEnabled(!twoFAEnabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    twoFAEnabled
                      ? 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                  }`}
                >
                  {twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
              </div>

              {/* Active Sessions */}
              <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100">
                  <h2 className="text-sm font-bold text-zinc-800">Active Sessions</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Devices currently signed into your account.</p>
                </div>
                <div className="divide-y divide-zinc-100">
                  {[
                    { device: 'MacBook Pro (Current)', location: 'Los Angeles, CA', lastSeen: 'Right now', isCurrent: true },
                    { device: 'iPhone 15 Pro', location: 'Beverly Hills, CA', lastSeen: '2h ago', isCurrent: false },
                  ].map((s) => (
                    <div key={s.device} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-800">{s.device} {s.isCurrent && <span className="ml-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">ACTIVE</span>}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{s.location} · {s.lastSeen}</p>
                      </div>
                      {!s.isCurrent && (
                        <button className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── APPEARANCE SECTION ── */}
          {activeSection === 'appearance' && (
            <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-100">
                <h2 className="text-sm font-bold text-zinc-800">Appearance & Theme</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">Customize how the Luxe ERP platform looks and feels.</p>
              </div>
              <div className="p-6 space-y-6">
                {/* Theme Selector */}
                <div>
                  <label className={labelClass}>Color Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Light', sublabel: 'Clean & Professional', preview: 'bg-white border-zinc-200' },
                      { label: 'Dark', sublabel: 'High Contrast Mode', preview: 'bg-zinc-900 border-zinc-700' },
                      { label: 'System', sublabel: 'Match OS setting', preview: 'bg-gradient-to-r from-white to-zinc-900 border-zinc-400' },
                    ].map((theme, i) => (
                      <div
                        key={theme.label}
                        className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${
                          i === 0 ? 'border-emerald-400 bg-emerald-50/30' : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <div className={`h-10 rounded-lg border mb-2 ${theme.preview}`} />
                        <p className="text-xs font-semibold text-zinc-800">{theme.label}</p>
                        <p className="text-[10px] text-zinc-500">{theme.sublabel}</p>
                        {i === 0 && <span className="text-[9px] font-bold text-emerald-600">ACTIVE</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className={labelClass}>Accent Color</label>
                  <div className="flex items-center gap-3">
                    {[
                      { color: 'bg-emerald-500', label: 'Emerald' },
                      { color: 'bg-blue-500', label: 'Blue' },
                      { color: 'bg-violet-500', label: 'Violet' },
                      { color: 'bg-amber-500', label: 'Amber' },
                      { color: 'bg-rose-500', label: 'Rose' },
                    ].map((c, i) => (
                      <button
                        key={c.label}
                        title={c.label}
                        className={`h-8 w-8 rounded-lg ${c.color} transition-all hover:scale-110 ${i === 0 ? 'ring-2 ring-offset-2 ring-emerald-400' : ''}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Sidebar Density */}
                <div>
                  <label className={labelClass}>Sidebar Density</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Compact', 'Comfortable'].map((d, i) => (
                      <div
                        key={d}
                        className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${
                          i === 1 ? 'border-emerald-400 bg-emerald-50/30' : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <p className="text-xs font-semibold text-zinc-800">{d}</p>
                        <p className="text-[10px] text-zinc-500">{i === 0 ? 'Less padding, more items visible' : 'Spacious and easy to navigate'}</p>
                        {i === 1 && <span className="text-[9px] font-bold text-emerald-600">ACTIVE</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── INTEGRATIONS SECTION ── */}
          {activeSection === 'integrations' && (
            <div className="space-y-6">
              {/* Apps Script Integration */}
              <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-800">Google Apps Script</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Automate lead processing and data synchronization.</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Database className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Apps Script Web App URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                      <input 
                        type="url" 
                        className={`${inputClass} pl-10`}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        value={appsScriptUrl}
                        onChange={(e) => setAppsScriptUrl(e.target.value)}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 italic">Enter the deployed Web App URL from your Google Apps Script project.</p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveIntegrations}
                      className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-zinc-800 transition-all active:scale-95"
                    >
                      {integrationsSaved ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Configuration Saved
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          Save Integration
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Other Integrations */}
              <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100">
                  <h2 className="text-sm font-bold text-zinc-800">Other Platform Integrations</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Connect your favorite tools with Luxe ERP.</p>
                </div>
                <div className="divide-y divide-zinc-100">
                  {[
                    { name: 'Zillow API', description: 'Sync property listings and leads from Zillow portal.', connected: true, logo: 'Z' },
                    { name: 'Google Calendar', description: 'Sync site visits and appointments to Google Calendar.', connected: true, logo: 'G' },
                    { name: 'Twilio SMS', description: 'Send automated SMS follow-ups and notifications to clients.', connected: false, logo: 'T' },
                    { name: 'HubSpot CRM', description: 'Two-way sync of leads and client data with HubSpot.', connected: false, logo: 'H' },
                    { name: 'DocuSign', description: 'Send contracts for digital signing directly from ERP.', connected: false, logo: 'D' },
                    { name: 'Stripe Payments', description: 'Collect deposits and process client payments via Stripe.', connected: false, logo: 'S' },
                  ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-xl bg-zinc-100 border border-zinc-200 text-sm font-black text-zinc-600 flex items-center justify-center">
                        {integration.logo}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-800">{integration.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{integration.description}</p>
                      </div>
                    </div>
                    <button
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        integration.connected
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                          : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {integration.connected ? '✓ Connected' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

        </div>
      </div>
    </div>
  );
}
