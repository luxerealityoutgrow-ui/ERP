"use client";

import React, { useState, useEffect } from 'react';
import { fetchSetting, updateSetting } from '@/lib/queries';
import { useProfile } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import { supabase } from '@/lib/supabaseClient';
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
  Building2,
  Users,
  UserPlus,
  Trash2
} from 'lucide-react';

type SettingSection = 'profile' | 'notifications' | 'security' | 'users';

const sections: { id: SettingSection; label: string; icon: React.ElementType; description: string; superAdminOnly?: boolean }[] = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Manage your identity and personal details.' },
  { id: 'users', label: 'User Management', icon: Users, description: 'Manage team members and their roles.', superAdminOnly: true },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure alerts and notification preferences.' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Passwords, 2FA, and access control settings.' },
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
  const profile = useProfile();
  const perms = getPermissions(profile?.role);
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');

  // User management state (SuperAdmin only)
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('SalesPerson');
  const [savingUser, setSavingUser] = useState(false);

  // Profile form state
  const [fullName, setFullName] = useState('Rahul Sharma');
  const [email, setEmail] = useState('rahul@luxerealty.in');
  const [phone, setPhone] = useState('+91 98200 12345');
  const [role, setRole] = useState('Senior Agent');
  const [agency, setAgency] = useState('Luxe Realty India');
  const [bio, setBio] = useState('Luxury real estate specialist with 8+ years of experience in high-value residential and commercial properties across Pune and Maharashtra.');
  const [profileSaved, setProfileSaved] = useState(false);

  // Security state
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);
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

  // Load team members for SuperAdmin
  useEffect(() => {
    if (!perms.canManageUsers) return;
    async function loadUsers() {
      setLoadingUsers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, created_at')
          .order('created_at', { ascending: false });
        if (data) setTeamMembers(data);
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, [perms.canManageUsers]);

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    if (!error) {
      setTeamMembers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserName) return;
    setSavingUser(true);
    try {
      // Insert a profile record (user will need to sign up separately via Supabase Auth)
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          email: newUserEmail,
          full_name: newUserName,
          role: newUserRole,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (data) {
        setTeamMembers(prev => [data, ...prev]);
        setNewUserEmail('');
        setNewUserName('');
        setNewUserRole('SalesPerson');
        setShowAddUser(false);
      }
      if (error) console.error('Error adding user:', error);
    } catch (err) {
      console.error('Error adding user:', err);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (!error) {
      setTeamMembers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleSaveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleUpdatePassword = async () => {
    setPasswordMessage(null);
    if (!newPassword || !confirmPassword) {
      setPasswordMessage({ text: 'Please fill in all password fields.', type: 'err' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'New password must be at least 6 characters.', type: 'err' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New password and confirmation do not match.', type: 'err' });
      return;
    }
    setPasswordUpdating(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      console.log('Password update response:', { data, error });
      if (error) {
        setPasswordMessage({ text: `Error: ${error.message}`, type: 'err' });
      } else {
        setPasswordMessage({ text: 'Password updated successfully!', type: 'ok' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error('Password update error:', err);
      setPasswordMessage({ text: `Error: ${err?.message || 'An unexpected error occurred.'}`, type: 'err' });
    } finally {
      setPasswordUpdating(false);
    }
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

  const inputClass = "w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 transition-all";
  const labelClass = "text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-zinc-900">



      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Sidebar Nav */}
        <div className="lg:col-span-3">
          <nav className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-2 space-y-1">
            {sections.filter(s => !s.superAdminOnly || perms.canManageUsers).map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-zinc-50 text-zinc-700 border border-zinc-100'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-zinc-600' : 'text-zinc-400'}`} />
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold leading-none">{s.label}</p>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 ${isActive ? 'text-zinc-500' : 'text-zinc-300'}`} />
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
                    <div className="h-16 w-16 rounded-2xl bg-zinc-50 border-2 border-zinc-100 flex items-center justify-center font-black text-2xl text-zinc-600">
                      D
                    </div>
                    <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-white border border-zinc-200 shadow-sm flex items-center justify-center hover:bg-zinc-50 transition-colors">
                      <Camera className="h-3 w-3 text-zinc-500" />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-800">{fullName}</p>
                    <p className="text-xs text-zinc-500">{role} • {agency}</p>
                    <button className="text-[10px] font-bold text-zinc-600 hover:text-zinc-700 mt-1 transition-colors">Change photo</button>
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
                        ? 'bg-zinc-50 text-zinc-600 border border-zinc-200'
                        : 'bg-zinc-600 text-white hover:bg-zinc-700 shadow-sm'
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
                          ? 'bg-zinc-500 border-zinc-500'
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
                  {passwordMessage && (
                    <div className={`p-3 rounded-xl text-xs font-medium ${passwordMessage.type === 'ok' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
                      {passwordMessage.text}
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
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
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                    <button
                      onClick={handleUpdatePassword}
                      disabled={passwordUpdating}
                      className="px-5 py-2.5 rounded-xl bg-zinc-600 text-white text-xs font-bold hover:bg-zinc-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {passwordUpdating ? 'Updating...' : 'Update Password'}
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
                    twoFAEnabled ? 'bg-zinc-50 text-zinc-600 border-zinc-100' : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                  }`}>
                    {twoFAEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <button
                  onClick={() => setTwoFAEnabled(!twoFAEnabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    twoFAEnabled
                      ? 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
                      : 'bg-zinc-50 text-zinc-600 border border-zinc-100 hover:bg-zinc-100'
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
                  <div className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-800">Current Web Session <span className="ml-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">ACTIVE</span></p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Primary Web Dashboard · Active Now</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── USER MANAGEMENT SECTION (SuperAdmin only) ── */}
          {activeSection === 'users' && perms.canManageUsers && (
            <div className="space-y-5">
              <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-800">Team Members</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Manage users and assign access levels.</p>
                  </div>
                  <button
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add User
                  </button>
                </div>

                {/* Add User Form */}
                {showAddUser && (
                  <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email</label>
                        <input
                          type="email"
                          placeholder="user@luxerealty.in"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Role</label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 transition-all cursor-pointer"
                        >
                          <option value="SalesPerson">SalesPerson</option>
                          <option value="Admin">Admin</option>
                          <option value="SuperAdmin">SuperAdmin</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleAddUser}
                          disabled={savingUser || !newUserEmail || !newUserName}
                          className="w-full px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingUser ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Users Table */}
                {loadingUsers ? (
                  <div className="p-6 space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-12 bg-zinc-50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {teamMembers.length === 0 ? (
                      <div className="p-8 text-center">
                        <Users className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                        <p className="text-xs text-zinc-500">No team members found.</p>
                      </div>
                    ) : (
                      teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600">
                              {member.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-zinc-800">{member.full_name || 'Unnamed'}</p>
                              <p className="text-[10px] text-zinc-500">{member.email || 'No email'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              value={member.role || 'SalesPerson'}
                              onChange={(e) => handleUpdateUserRole(member.id, e.target.value)}
                              className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold cursor-pointer outline-none transition-all ${
                                member.role === 'SuperAdmin' 
                                  ? 'bg-violet-50 text-violet-700 border-violet-200' 
                                  : member.role === 'Admin' 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                    : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                              }`}
                            >
                              <option value="SalesPerson">SalesPerson</option>
                              <option value="Admin">Admin</option>
                              <option value="SuperAdmin">SuperAdmin</option>
                            </select>
                            {member.id !== profile?.id && (
                              <button
                                onClick={() => handleDeleteUser(member.id)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Remove user"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Role Permissions Legend */}
              <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100">
                  <h2 className="text-sm font-bold text-zinc-800">Role Permissions</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Overview of what each role can access.</p>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-100">
                          <th className="pb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Permission</th>
                          <th className="pb-2 text-[10px] font-bold text-violet-600 uppercase tracking-wider text-center">SuperAdmin</th>
                          <th className="pb-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider text-center">Admin</th>
                          <th className="pb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider text-center">SalesPerson</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {[
                          { label: 'View all leads', sa: true, a: true, sp: false },
                          { label: 'Create/edit leads', sa: true, a: true, sp: true },
                          { label: 'Delete leads', sa: true, a: true, sp: false },
                          { label: 'Create/edit properties', sa: true, a: true, sp: false },
                          { label: 'View reporting', sa: true, a: true, sp: false },
                          { label: 'Manage settings', sa: true, a: true, sp: false },
                          { label: 'Manage users', sa: true, a: false, sp: false },
                          { label: 'Export data', sa: true, a: true, sp: false },
                          { label: 'Bulk delete', sa: true, a: true, sp: false },
                        ].map((row) => (
                          <tr key={row.label} className="border-b border-zinc-50">
                            <td className="py-2 font-medium text-zinc-700">{row.label}</td>
                            <td className="py-2 text-center">{row.sa ? '✓' : '—'}</td>
                            <td className="py-2 text-center">{row.a ? '✓' : '—'}</td>
                            <td className="py-2 text-center">{row.sp ? '✓' : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
