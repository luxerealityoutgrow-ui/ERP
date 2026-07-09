"use client";

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  Shield,
  UserPlus,
  Trash2,
  Save,
  Check,
  X,
  Mail,
  Phone,
  ChevronDown
} from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at?: string;
}

interface ModulePermission {
  module: string;
  label: string;
  description: string;
  enabled: boolean;
}

const ALL_MODULES: { key: string; label: string; description: string }[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'View KPIs and analytics' },
  { key: 'leads', label: 'Leads', description: 'View and manage leads' },
  { key: 'leads_create', label: 'Create Leads', description: 'Add new leads' },
  { key: 'leads_delete', label: 'Delete Leads', description: 'Remove leads permanently' },
  { key: 'properties', label: 'Properties', description: 'View property inventory' },
  { key: 'properties_create', label: 'Create Properties', description: 'Add new property listings' },
  { key: 'properties_delete', label: 'Delete Properties', description: 'Remove properties' },
  { key: 'pipeline', label: 'Sales Pipeline', description: 'View deal pipeline' },
  { key: 'matchmaking', label: 'Matchmaking', description: 'Property-lead matching' },
  { key: 'calendar', label: 'Calendar / Site Visits', description: 'Manage site visits' },
  { key: 'reporting', label: 'Reporting', description: 'View sales reports & analytics' },
  { key: 'settings', label: 'Settings', description: 'App configuration' },
  { key: 'export', label: 'Export Data', description: 'CSV/Excel export' },
];

export default function UserManagementPage() {
  const profile = useProfile();
  const perms = getPermissions(profile?.role);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [savingPerms, setSavingPerms] = useState(false);
  const [saved, setSaved] = useState(false);

  // Add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('SalesPerson');
  const [newPassword, setNewPassword] = useState('Luxe@2026');
  const [addingUser, setAddingUser] = useState(false);

  // Load team members
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .order('created_at', { ascending: true });
      if (data) setMembers(data);
      setLoading(false);
    }
    load();
  }, []);

  // Load permissions for selected user
  useEffect(() => {
    if (!selectedUser) return;
    async function loadPerms() {
      const { data } = await supabase
        .from('user_permissions')
        .select('module, enabled')
        .eq('user_id', selectedUser!.id);
      
      // Build permission map - start with role defaults, then override with per-user settings
      const rolePerms = getPermissions(selectedUser!.role);
      const permMap: Record<string, boolean> = {};
      ALL_MODULES.forEach(m => {
        // Map module key to role permission
        const roleDefault = getRoleDefaultForModule(m.key, rolePerms);
        permMap[m.key] = roleDefault;
      });
      // Override with user-specific permissions
      if (data) {
        data.forEach(p => {
          permMap[p.module] = p.enabled;
        });
      }
      setUserPermissions(permMap);
    }
    loadPerms();
  }, [selectedUser]);

  function getRoleDefaultForModule(moduleKey: string, rolePerms: any): boolean {
    const map: Record<string, string> = {
      dashboard: 'canViewDashboard',
      leads: 'canViewLeads',
      leads_create: 'canCreateLeads',
      leads_delete: 'canDeleteLeads',
      properties: 'canViewProperties',
      properties_create: 'canCreateProperties',
      properties_delete: 'canDeleteProperties',
      pipeline: 'canViewPipeline',
      matchmaking: 'canViewMatchmaking',
      calendar: 'canViewCalendar',
      reporting: 'canViewReporting',
      settings: 'canViewSettings',
      export: 'canExportData',
    };
    const permKey = map[moduleKey];
    return permKey ? rolePerms[permKey] : true;
  }

  const handleTogglePermission = (module: string) => {
    setUserPermissions(prev => ({ ...prev, [module]: !prev[module] }));
    setSaved(false);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setSavingPerms(true);
    
    // Upsert all permissions
    const upserts = Object.entries(userPermissions).map(([module, enabled]) => ({
      user_id: selectedUser.id,
      module,
      enabled,
      updated_at: new Date().toISOString(),
    }));

    // Delete existing then insert fresh
    await supabase.from('user_permissions').delete().eq('user_id', selectedUser.id);
    const { error } = await supabase.from('user_permissions').insert(upserts);
    
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSavingPerms(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    if (!error) {
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
      }
    }
  };

  const handleAddUser = async () => {
    if (!newName || !newEmail) return;
    setAddingUser(true);
    // Note: In production, use Supabase Admin API. For now, just create the profile.
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        email: newEmail,
        full_name: newName,
        role: newRole,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (data) {
      setMembers(prev => [...prev, data]);
      setShowAddForm(false);
      setNewName('');
      setNewEmail('');
      setNewRole('SalesPerson');
    }
    setAddingUser(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Remove this user? This cannot be undone.')) return;
    await supabase.from('user_permissions').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);
    setMembers(prev => prev.filter(m => m.id !== userId));
    if (selectedUser?.id === userId) setSelectedUser(null);
  };

  // Access check
  if (profile && !perms.canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-zinc-300 mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-zinc-500">User management is only available for SuperAdmins.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-sm"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add User
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-zinc-900 mb-4">Add New Team Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full Name"
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-400" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@luxerealtypune.com"
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-400" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Password</label>
              <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-400" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-400 cursor-pointer">
                <option value="SalesPerson">Sales Executive</option>
                <option value="Admin">Admin</option>
                <option value="SuperAdmin">SuperAdmin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleAddUser} disabled={addingUser || !newName || !newEmail}
                className="w-full px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 transition-all">
                {addingUser ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Users List */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">Team Members ({members.length})</h3>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-zinc-50 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {members.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedUser(member)}
                    className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-all ${
                      selectedUser?.id === member.id ? 'bg-zinc-50 border-l-2 border-zinc-900' : 'hover:bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                        member.role === 'SuperAdmin' ? 'bg-violet-100 text-violet-700' :
                        member.role === 'Admin' ? 'bg-blue-100 text-blue-700' :
                        'bg-zinc-100 text-zinc-600'
                      }`}>
                        {member.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900">{member.full_name}</p>
                        <p className="text-[10px] text-zinc-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        member.role === 'SuperAdmin' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                        member.role === 'Admin' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-zinc-50 text-zinc-600 border-zinc-200'
                      }`}>
                        {member.role === 'SalesPerson' ? 'Sales Exec' : member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Permission Editor */}
        <div className="lg:col-span-7">
          {selectedUser ? (
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
              {/* User Header */}
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold ${
                    selectedUser.role === 'SuperAdmin' ? 'bg-violet-100 text-violet-700' :
                    selectedUser.role === 'Admin' ? 'bg-blue-100 text-blue-700' :
                    'bg-zinc-100 text-zinc-600'
                  }`}>
                    {selectedUser.full_name?.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">{selectedUser.full_name}</h3>
                    <p className="text-[10px] text-zinc-500">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedUser.role}
                    onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer outline-none transition-all ${
                      selectedUser.role === 'SuperAdmin' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                      selectedUser.role === 'Admin' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-zinc-50 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    <option value="SalesPerson">Sales Executive</option>
                    <option value="Admin">Admin</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                  {selectedUser.id !== profile?.id && (
                    <button
                      onClick={() => handleDeleteUser(selectedUser.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Module Permissions */}
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">Module Permissions</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Toggle individual module access for this user</p>
                </div>
                <button
                  onClick={handleSavePermissions}
                  disabled={savingPerms}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    saved
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                  {saved ? 'Saved!' : savingPerms ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>

              <div className="divide-y divide-zinc-50">
                {ALL_MODULES.map((mod) => (
                  <div key={mod.key} className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-50/50 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-zinc-800">{mod.label}</p>
                      <p className="text-[10px] text-zinc-500">{mod.description}</p>
                    </div>
                    <button
                      onClick={() => handleTogglePermission(mod.key)}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors cursor-pointer ${
                        userPermissions[mod.key]
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-zinc-200 border-zinc-200'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform mt-px ${
                        userPermissions[mod.key] ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
              <Shield className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-700 mb-1">Select a team member</h3>
              <p className="text-xs text-zinc-500">Click on a user from the list to manage their module permissions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
