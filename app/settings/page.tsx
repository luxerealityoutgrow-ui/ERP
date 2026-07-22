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
  Trash2,
  KeyRound,
  SlidersHorizontal,
  X,
  Sparkles
} from 'lucide-react';

type SettingSection = 'profile' | 'users' | 'notifications' | 'integrations' | 'security';

const sections: { id: SettingSection; label: string; icon: React.ElementType; description: string; superAdminOnly?: boolean }[] = [
  { id: 'profile', label: 'Personal Profile', icon: User, description: 'Manage your identity and personal details.' },
  { id: 'users', label: 'Team & Permissions', icon: Users, description: 'Manage team members and granular module access control.' },
  { id: 'notifications', label: 'Notifications & Alerts', icon: Bell, description: 'Configure email digests and push alerts.' },
  { id: 'integrations', label: 'Integrations & Webhooks', icon: Globe, description: 'Manage Google Apps Script and lead webhooks.' },
  { id: 'security', label: 'Security & Passwords', icon: Shield, description: 'Passwords, 2FA, and session access control.' },
];

const notifOptions = [
  { id: 'new_lead', label: 'New Lead Assigned', description: 'Get notified when a new lead is assigned to you.', defaultOn: true },
  { id: 'deal_update', label: 'Deal Stage Updates', description: 'Alerts when a deal moves through the pipeline.', defaultOn: true },
  { id: 'site_visit', label: 'Site Visit Reminders', description: '1-hour reminder before scheduled property tours.', defaultOn: true },
  { id: 'report_ready', label: 'Monthly Reports', description: 'Email digest of your monthly performance report.', defaultOn: false },
  { id: 'team_activity', label: 'Team Activity Feed', description: 'Notifications about your team\'s CRM activity.', defaultOn: false },
  { id: 'platform', label: 'Platform Updates', description: 'Product updates, new features, and changelogs.', defaultOn: false },
];

const MODULE_PERMISSIONS = [
  { key: 'leads', label: 'Leads Management', description: 'View and manage client leads database' },
  { key: 'leads_delete', label: 'Delete Lead Contacts', description: 'Permanently purge lead contact records' },
  { key: 'properties', label: 'Property Inventory', description: 'View and edit property listings' },
  { key: 'pipeline', label: 'Sales Pipeline', description: 'Access deal stages & Kanban board' },
  { key: 'matchmaking', label: 'Matchmaker AI', description: 'Property-lead fit matching engine' },
  { key: 'calendar', label: 'Site Visit Calendar', description: 'Schedule and manage site tours' },
  { key: 'reporting', label: 'Analytics & Reporting', description: 'View performance digests and charts' },
  { key: 'export', label: 'Export Data (CSV)', description: 'Download CSV and Excel reports' },
];

export default function SettingsPage() {
  const profile = useProfile();
  const perms = getPermissions(profile?.role);
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');

  // Team & Permissions State
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);
  const [permsSaved, setPermsSaved] = useState(false);

  // Add User Modal State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('SalesPerson');
  const [savingUser, setSavingUser] = useState(false);

  // Profile Form State
  const [fullName, setFullName] = useState(profile?.full_name || 'Rahul Sharma');
  const [email, setEmail] = useState(profile?.email || 'rahul@luxerealty.in');
  const [phone, setPhone] = useState('+91 98200 12345');
  const [role, setRole] = useState(profile?.role || 'Senior Agent');
  const [agency, setAgency] = useState('Luxe Realty India');
  const [bio, setBio] = useState('Luxury real estate specialist with 8+ years of experience in high-value residential and commercial properties across Pune.');
  const [profileSaved, setProfileSaved] = useState(false);

  // Security State
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  // Notification Toggles State
  const [notifStates, setNotifStates] = useState<Record<string, boolean>>(
    Object.fromEntries(notifOptions.map(n => [n.id, n.defaultOn]))
  );

  // Integrations State
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [integrationsSaved, setIntegrationsSaved] = useState(false);

  // Load Integration Settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const url = await fetchSetting('apps_script_url');
        setAppsScriptUrl(url || '');
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
    loadSettings();
  }, []);

  // Sync profile props
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.email) setEmail(profile.email);
      if (profile.role) setRole(profile.role);
    }
  }, [profile]);

  // Fetch Team Roster
  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, created_at')
          .order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setTeamMembers(data);
          setSelectedUser(data[0]);
        }
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  // Fetch User Permissions when selectedUser changes
  useEffect(() => {
    if (!selectedUser) return;
    async function loadPerms() {
      try {
        const { data } = await supabase
          .from('user_permissions')
          .select('module, enabled')
          .eq('user_id', selectedUser.id);
        
        const rolePerms = getPermissions(selectedUser.role);
        const map: Record<string, boolean> = {
          leads: rolePerms.canViewAllLeads || selectedUser.role === 'SuperAdmin',
          leads_delete: rolePerms.canDeleteLeads || selectedUser.role === 'SuperAdmin',
          properties: rolePerms.canCreateProperties || selectedUser.role === 'SuperAdmin',
          pipeline: true,
          matchmaking: true,
          calendar: perms.canViewAllCalendar || selectedUser.role === 'SuperAdmin',
          reporting: perms.canViewReporting || selectedUser.role === 'SuperAdmin',
          export: perms.canExportData || selectedUser.role === 'SuperAdmin'
        };

        if (data && data.length > 0) {
          data.forEach(p => {
            map[p.module] = p.enabled;
          });
        }
        setUserPermissions(map);
      } catch (err) {
        console.error('Error loading user permissions:', err);
      }
    }
    loadPerms();
  }, [selectedUser, perms.canViewAllCalendar, perms.canViewReporting, perms.canExportData]);

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    if (!error) {
      setTeamMembers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser((prev: any) => ({ ...prev, role: newRole }));
      }
    }
  };

  const handleToggleModulePermission = (key: string) => {
    setUserPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveUserPermissions = async () => {
    if (!selectedUser) return;
    setSavingPerms(true);
    try {
      // Save each module permission override
      for (const [mod, enabled] of Object.entries(userPermissions)) {
        await supabase
          .from('user_permissions')
          .upsert({
            user_id: selectedUser.id,
            module: mod,
            enabled,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,module' });
      }
      setPermsSaved(true);
      setTimeout(() => setPermsSaved(false), 2000);
    } catch (err) {
      console.error('Error saving user permissions:', err);
    } finally {
      setSavingPerms(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserName) return;
    setSavingUser(true);
    try {
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
        setSelectedUser(data);
        setNewUserEmail('');
        setNewUserName('');
        setNewUserRole('SalesPerson');
        setShowAddUser(false);
      }
    } catch (err) {
      console.error('Error adding user:', err);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (!error) {
      const updated = teamMembers.filter(u => u.id !== userId);
      setTeamMembers(updated);
      if (selectedUser?.id === userId) {
        setSelectedUser(updated[0] || null);
      }
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
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordMessage({ text: `Error: ${error.message}`, type: 'err' });
      } else {
        setPasswordMessage({ text: 'Password updated successfully!', type: 'ok' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
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
      alert('Failed to save integration settings.');
    }
  };

  const inputClass = "w-full bg-white border border-[#e8e7e4] rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[#d4ad4d] transition-all";
  const labelClass = "text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1";

  return (
    <div className="w-full space-y-6 pb-20 text-zinc-900 text-left">
      
      {/* ── UNIFIED PORCELAIN CARD FRAME (Direction C Signature) ── */}
      <div className="bg-white border border-[#e8e7e4] rounded-[20px] shadow-xs overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-6 md:px-8 border-b border-[#ebebeb] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[19px] font-extrabold text-zinc-900 tracking-tight" style={{ letterSpacing: '-0.4px' }}>
                System Settings & Administration
              </h1>
              <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold bg-[#f4ebd0] text-[#967420] border border-[#e8d5a3] uppercase tracking-wider">
                Luxe ERP
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
              Manage personal identity, team roles, module permissions & platform security · Luxe Realty Pune
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveSection('users');
              setShowAddUser(true);
            }}
            className="dc-btn gold font-extrabold text-[11px] px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            + Add Team Member
          </button>
        </div>

        {/* ── INNER SPLIT WORKSPACE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
          
          {/* Left Vertical Navigation Rail (3 cols) */}
          <div className="lg:col-span-3 border-r border-[#ebebeb] py-4 bg-white space-y-1">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all border-r-2 ${
                    isActive
                      ? 'border-[#d4ad4d] bg-[#fafaf8] text-zinc-900 font-extrabold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-[#fafaf8]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-[#d4ad4d] ring-4 ring-[#d4ad4d]/20' : 'bg-[#e0e0de]'}`} />
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#b8922e]' : 'text-zinc-400'}`} />
                  <span className="text-[11.5px]">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Section Content Panel (9 cols) */}
          <div className="lg:col-span-9 p-6 md:p-8 bg-[#fafaf8]/40">
            
            {/* ── PERSONAL PROFILE TAB ── */}
            {activeSection === 'profile' && (
              <div className="space-y-6 max-w-2xl">
                <div className="border-b border-[#ebebeb] pb-4">
                  <h2 className="text-[14px] font-extrabold text-zinc-900">Personal Identity & Profile</h2>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Manage your personal credentials, contact email, title, and bio</p>
                </div>

                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-2xl bg-[#f4ebd0] border-2 border-[#e8d5a3] flex items-center justify-center font-black text-xl text-[#967420] shadow-2xs">
                    {fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-extrabold text-zinc-900">{fullName}</h3>
                    <p className="text-[11px] text-zinc-400 font-medium">{role} · {agency}</p>
                    <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-[#f4ebd0] text-[#967420] border border-[#e8d5a3] uppercase tracking-wider mt-1">
                      {profile?.role || 'SalesPerson'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Title / Role</label>
                    <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Brokerage / Agency</label>
                    <input type="text" value={agency} onChange={(e) => setAgency(e.target.value)} className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Bio / Profile Note</label>
                    <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className={`${inputClass} resize-none h-20`} />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="dc-btn gold font-extrabold text-[11px] px-5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {profileSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                    {profileSaved ? 'Profile Saved!' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* ── TEAM & GRANULAR PERMISSIONS TAB (Merged Users Page!) ── */}
            {activeSection === 'users' && (
              <div className="space-y-6">
                
                <div className="border-b border-[#ebebeb] pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-[14px] font-extrabold text-zinc-900">Team Administration & Granular Permissions</h2>
                    <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Select a team member to configure individual module access overrides</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddUser(true)}
                    className="dc-btn gold font-extrabold text-[10.5px] px-3.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    + New User
                  </button>
                </div>

                {/* Split Roster & Permission Matrix Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Team Roster List (4 cols) */}
                  <div className="lg:col-span-4 space-y-2.5">
                    <div className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest px-1">
                      Team Roster ({teamMembers.length})
                    </div>
                    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                      {teamMembers.map((member) => {
                        const isSelected = selectedUser?.id === member.id;
                        return (
                          <div
                            key={member.id}
                            onClick={() => setSelectedUser(member)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#fffdf5] border-[#d4ad4d] shadow-2xs'
                                : 'bg-white border-[#e8e7e4] hover:border-zinc-300'
                            }`}
                          >
                            <div className="space-y-0.5 text-left">
                              <p className={`text-[11.5px] font-extrabold ${isSelected ? 'text-[#b8922e]' : 'text-zinc-900'}`}>
                                {member.full_name || 'Unnamed User'}
                              </p>
                              <p className="text-[9.5px] text-zinc-400 font-medium truncate max-w-[140px]">
                                {member.email}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase border ${
                                member.role === 'SuperAdmin' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                member.role === 'Admin' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {member.role || 'SalesPerson'}
                              </span>
                              {member.id !== profile?.id && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteUser(member.id);
                                  }}
                                  className="text-zinc-300 hover:text-rose-600 transition-colors p-0.5"
                                  title="Remove member"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Selected User Permission Inspector Matrix (8 cols) */}
                  <div className="lg:col-span-8 bg-white border border-[#e8e7e4] rounded-2xl p-5 shadow-xs space-y-5">
                    {selectedUser ? (
                      <>
                        <div className="flex items-center justify-between border-b border-[#f5f5f3] pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-[13px] font-extrabold text-zinc-900">
                                Access Permissions · {selectedUser.full_name}
                              </h3>
                              <select
                                value={selectedUser.role || 'SalesPerson'}
                                onChange={(e) => handleUpdateUserRole(selectedUser.id, e.target.value)}
                                className="px-2 py-0.5 rounded-lg border text-[9.5px] font-extrabold border-[#e8e7e4] bg-[#fafaf8] text-zinc-800 cursor-pointer focus:outline-none"
                              >
                                <option value="SalesPerson">SalesPerson</option>
                                <option value="Admin">Admin</option>
                                <option value="SuperAdmin">SuperAdmin</option>
                              </select>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                              {selectedUser.email} · Override default role permissions per module
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleSaveUserPermissions}
                            disabled={savingPerms}
                            className="dc-btn gold font-extrabold text-[10.5px] px-3.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                          >
                            {permsSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                            {permsSaved ? 'Saved!' : savingPerms ? 'Saving...' : 'Save Matrix'}
                          </button>
                        </div>

                        {/* Granular Module Permission Matrix Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {MODULE_PERMISSIONS.map((mod) => {
                            const isChecked = !!userPermissions[mod.key];
                            return (
                              <div key={mod.key} className="p-3 border border-[#ebebeb] rounded-xl flex items-center justify-between bg-white hover:border-[#d4ad4d]/40 transition-all">
                                <div className="space-y-0.5 pr-2">
                                  <div className="text-[11px] font-extrabold text-zinc-900">{mod.label}</div>
                                  <div className="text-[9px] text-zinc-400 font-medium leading-tight">{mod.description}</div>
                                </div>
                                
                                {/* Gold Switch Toggle */}
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleModulePermission(mod.key)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-8 h-4 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#d4ad4d]" />
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="py-16 text-center text-zinc-400">
                        <Users className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
                        <p className="text-xs font-bold">Select a team member to view permissions</p>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeSection === 'notifications' && (
              <div className="space-y-6 max-w-2xl">
                <div className="border-b border-[#ebebeb] pb-4">
                  <h2 className="text-[14px] font-extrabold text-zinc-900">Notification Preferences & Alerts</h2>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Select which activity updates and reminders trigger real-time alerts</p>
                </div>

                <div className="space-y-3">
                  {notifOptions.map((opt) => (
                    <div key={opt.id} className="p-4 bg-white border border-[#e8e7e4] rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[11.5px] font-extrabold text-zinc-900">{opt.label}</p>
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{opt.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={!!notifStates[opt.id]}
                          onChange={() => setNotifStates(prev => ({ ...prev, [opt.id]: !prev[opt.id] }))}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#d4ad4d]" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── INTEGRATIONS TAB ── */}
            {activeSection === 'integrations' && (
              <div className="space-y-6 max-w-2xl">
                <div className="border-b border-[#ebebeb] pb-4">
                  <h2 className="text-[14px] font-extrabold text-zinc-900">Google Apps Script & Lead Webhook Sync</h2>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Configure endpoint URLs for syncing Facebook/Website leads directly into Luxe ERP</p>
                </div>

                <div className="space-y-3">
                  <label className={labelClass}>Google Apps Script Webhook Deployment URL</label>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={appsScriptUrl}
                    onChange={(e) => setAppsScriptUrl(e.target.value)}
                    className={inputClass}
                  />
                  <p className="text-[10px] text-zinc-400 font-medium">
                    This Webhook automatically ingests incoming lead submissions into Supabase and assigns them to active sales agents.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveIntegrations}
                    className="dc-btn gold font-extrabold text-[11px] px-5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {integrationsSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                    {integrationsSaved ? 'Endpoint Saved!' : 'Save Integration'}
                  </button>
                </div>
              </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeSection === 'security' && (
              <div className="space-y-6 max-w-2xl">
                <div className="border-b border-[#ebebeb] pb-4">
                  <h2 className="text-[14px] font-extrabold text-zinc-900">Security & Credentials</h2>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Update password and manage 2FA settings</p>
                </div>

                {passwordMessage && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${passwordMessage.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {passwordMessage.text}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>New Password</label>
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={passwordUpdating}
                    className="dc-btn gold font-extrabold text-[11px] px-5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {passwordUpdating ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ── ADD USER MODAL POPUP ── */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-[#e8e7e4] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-[#fafaf8]">
              <div>
                <h3 className="text-[14px] font-extrabold text-zinc-900">Add New Team Member</h3>
                <p className="text-[10px] text-zinc-400 font-medium">Create a new profile record for ERP access</p>
              </div>
              <button type="button" onClick={() => setShowAddUser(false)} className="p-1.5 hover:bg-zinc-200/50 rounded-lg transition-colors text-zinc-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  placeholder="E.g. Siddharth Verma"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Email Address *</label>
                <input
                  type="email"
                  placeholder="siddharth@luxerealty.in"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>System Access Role *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className={inputClass}
                >
                  <option value="SalesPerson">SalesPerson</option>
                  <option value="Admin">Admin</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#ebebeb]">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 rounded-xl border border-[#e8e7e4] text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddUser}
                  disabled={savingUser || !newUserEmail || !newUserName}
                  className="px-4 py-2 rounded-xl bg-[#d4ad4d] text-white text-xs font-extrabold hover:bg-[#b8922e] transition-all shadow-2xs disabled:opacity-50"
                >
                  {savingUser ? 'Adding...' : 'Create Team Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
