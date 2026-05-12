import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../../supabase';
import {
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
  CheckCircle2,
  XCircle,
  User,
  Building2,
  MapPin,
  MoreVertical,
  Trash2,
  Ban,
  UserPlus,
  AlertCircle,
  FileText,
  Package,
  History,
  TrendingUp,
  BadgeCheck,
  Plus,
  MessageCircle,
  Clock
} from 'lucide-react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const TABS = [
  { id: 'submissions', label: 'Verification Requests', icon: ShieldCheck },
  { id: 'active', label: 'Active Users', icon: User },
  { id: 'verified', label: 'Verified Accounts', icon: BadgeCheck },
  { id: 'restricted', label: 'Restricted Accounts', icon: Ban },
  { id: 'deactivated', label: 'Deactivated', icon: XCircle },
  { id: 'admins', label: 'Admin Management', icon: UserPlus },
];

export default function AdminVerification() {
  const [activeTab, setActiveTab] = useState('submissions');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, verified
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('7'); // Default 7 days
  const [showBanModal, setShowBanModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // CRUD States
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'donor', contact: '' });
  const [confirmAction, setConfirmAction] = useState(null); // { type, user }
  const [toast, setToast] = useState(null); // { message, type }
  const [appeals, setAppeals] = useState([]);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [selectedVerif, setSelectedVerif] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [verifLoading, setVerifLoading] = useState(false);
  const [showVerifModal, setShowVerifModal] = useState(false);
  const [adminInvites, setAdminInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  const logAdminAction = async ({ action, targetId, targetName, details, reason, metadata }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from('admin_audit_logs').insert({
        admin_id: session.user.id,
        admin_name: session.user.user_metadata?.full_name || 'Admin',
        action,
        target_id: targetId,
        target_name: targetName,
        details,
        reason,
        metadata
      });
    } catch (err) {
      console.warn('Audit logging failed:', err.message);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const fetchFB = supabase.from('foodbanks').select('id, org_name, logo_url');
      const fetchBrgy = supabase.from('barangays').select('id, barangay_name');
      const fetchAppeals = supabase.from('ban_appeals').select('*').eq('status', 'pending');

      const [
        profilesRes,
        fbRes,
        brgyRes,
        appealsRes,
        invitesRes
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        fetchFB,
        fetchBrgy,
        fetchAppeals,
        supabase.from('admin_invites').select('*')
      ]);

      const profiles = profilesRes.data || [];
      // If table doesn't exist (404), default to empty array
      setAdminInvites(invitesRes?.status === 404 ? [] : (invitesRes?.data || []));

      const foodbanks = fbRes.data || [];
      const barangays = brgyRes.data || [];
      const appealsData = appealsRes.data || [];

      const appealMap = Object.fromEntries((appealsData || []).map(a => [a.user_id, a]));
      setAppeals(appealsData || []);

      // Create lookup maps for quick access
      const fbMap = Object.fromEntries((foodbanks || []).map(f => [f.id, f]));
      const brgyMap = Object.fromEntries((barangays || []).map(b => [b.id, b]));

      const combined = (profiles || []).map(p => {
        let name = p.full_name || 'User';
        let avatar = null;

        if (p.role === 'foodbank' && fbMap[p.id]) {
          name = fbMap[p.id].org_name;
          avatar = fbMap[p.id].logo_url;
        } else if (p.role === 'barangay' && brgyMap[p.id]) {
          name = brgyMap[p.id].barangay_name;
          avatar = brgyMap[p.id].barangay_profile;
        }

        const isVerified = !!p.is_verified;
        const isBanned = !!p.is_banned;

        return {
          ...p,
          name,
          avatar,
          is_verified: isVerified,
          is_banned: isBanned,
          appeal: appealMap[p.id] || null,
          uniqueId: `${p.role}-${p.id}`,
          status: isVerified ? 'verified' : 'pending'
        };
      });

      setUsers(combined);
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingVerifications = async () => {
    setVerifLoading(true);
    try {
      const [fbRes, brgyRes] = await Promise.all([
        supabase.from('foodbank_verification').select(`*`),
        supabase.from('barangay_verification').select(`*`)
      ]);

      const fbDocs = (fbRes?.data || []).filter(d => d.verification_status === 'pending');
      const brgyDocs = (brgyRes?.data || []).filter(d => d.verification_status === 'pending');
      const combinedItems = [
        ...fbDocs.map(d => ({ ...d, type: 'foodbank', user_id: d.foodbank_id })),
        ...brgyDocs.map(d => ({ ...d, type: 'barangay', user_id: d.user_id }))
      ];

      if (combinedItems.length > 0) {
        const userIds = [...new Set(combinedItems.map(d => d.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .in('id', userIds);

        const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
        
        const normalized = combinedItems.map(d => ({
          ...d,
          profiles: profileMap[d.user_id] || null
        })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setPendingVerifications(normalized);
      } else {
        setPendingVerifications([]);
      }
    } catch (err) {
      console.error('Fetch verifications error:', err);
    } finally {
      setVerifLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingVerifications();
  }, []);

  const fetchUserHistory = async (user) => {
    setHistoryLoading(true);
    try {
      let query = supabase.from('donations').select('id, items, status, created_at');

      // Correctly map the role to the database column in donations
      if (user.role === 'donor') {
        query = query.eq('donor_id', user.id);
      } else if (user.role === 'foodbank') {
        query = query.eq('foodbank_id', user.id);
      } else if (user.role === 'barangay') {
        // Find if they are a recipient in donations
        query = query.eq('barangay_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setUserHistory(data || []);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleBan = async () => {
    try {
      const days = parseInt(banDuration);
      const bannedUntil = new Date();
      bannedUntil.setDate(bannedUntil.getDate() + days);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          ban_reason: banReason,
          banned_until: bannedUntil.toISOString()
        })
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      if (selectedUser.role === 'foodbank') {
        await supabase.from('foodbanks').update({ is_banned: true, ban_reason: banReason }).eq('id', selectedUser.id);
      } else if (selectedUser.role === 'barangay') {
        await supabase.from('barangays').update({ is_banned: true, ban_reason: banReason }).eq('id', selectedUser.id);
      }

      await logAdminAction({
        action: 'BAN',
        targetId: selectedUser.id,
        targetName: selectedUser.name,
        details: `Restricted access for ${days} days`,
        reason: banReason,
        metadata: { days, role: selectedUser.role, expires_at: bannedUntil.toISOString() }
      });

      setShowBanModal(false);
      setBanReason('');
      setBanDuration('7');
      setSelectedUser(null);
      await fetchUsers();
      setToast({ message: `Account ${selectedUser.name} restricted for ${days} days`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: 'Ban failed: ' + err.message, type: 'error' });
    }
  };

  const handleLiftBan = async (user) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          ban_reason: null,
          banned_until: null
        })
        .eq('id', user.id);

      if (error) throw error;

      await supabase
        .from('ban_appeals')
        .update({ status: 'reviewed' })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      await logAdminAction({
        action: 'UNBAN',
        targetId: user.id,
        targetName: user.name,
        details: 'Lifted account restriction',
        reason: 'Administrative Review / Appeal Accepted'
      });

      await fetchUsers();
      setShowAppealModal(false);
      setSelectedUser(null);
      setToast({ message: `Access restored for ${user.name}`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: 'Failed to lift ban: ' + err.message, type: 'error' });
    }
  };

  const handleApproveVerification = async (verif, status = 'approved') => {
    try {
      const table = verif.type === 'foodbank' ? 'foodbank_verification' : 'barangay_verification';

      const { error: docError } = await supabase
        .from(table)
        .update({
          verification_status: status,
          verified_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', verif.id);

      if (docError) throw docError;

      if (status === 'approved') {
        await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', verif.user_id);

        // Add notification for the user
        await supabase.from('notifications').insert({
          user_id: verif.user_id,
          title: 'Account Verified!',
          content: `Congratulations! Your ${verif.type} account has been officially verified by the ANGAY admin team.`,
          type: 'system',
          is_read: false
        });

        await logAdminAction({
          action: 'VERIFY',
          targetId: verif.user_id,
          targetName: verif.profiles?.full_name || 'Organization',
          details: `Approved verification request for ${verif.type}`,
          reason: 'Verified official documentation'
        });
      }

      await fetchPendingVerifications();
      await fetchUsers();
      setShowVerifModal(false);
      setSelectedVerif(null);
      setToast({ message: `Verification request ${status}`, type: 'success' });
    } catch (err) {
      setToast({ message: 'Action failed: ' + err.message, type: 'error' });
    }
  };

  const handleVerify = async (user) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', user.id);

      if (error) throw error;

      await logAdminAction({
        action: 'VERIFY',
        targetId: user.id,
        targetName: user.name,
        details: `Manually verified ${user.role} account`,
        reason: 'Direct admin verification'
      });

      await fetchUsers();
      setConfirmAction(null);
      setToast({ message: `${user.name} verified successfully!`, type: 'success' });
    } catch (err) {
      setToast({ message: 'Verification failed: ' + err.message, type: 'error' });
    }
  };

  const handleUpdateUser = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editUser.name,
          contact: editUser.contact,
          role: editUser.role
        })
        .eq('id', editUser.id)
        .select();

      if (error) throw error;

      await logAdminAction({
        action: 'UPDATE_USER',
        targetId: editUser.id,
        targetName: editUser.name,
        details: 'Updated account profile information',
        metadata: { changes: { name: editUser.name, role: editUser.role } }
      });

      await fetchUsers();
      setShowEditModal(false);
      setToast({ message: 'Account updated successfully', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: 'Update failed: ' + err.message, type: 'error' });
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      // Soft deactivate from foodbanks if applicable
      await supabase.from('foodbanks').update({ is_deactivated: true }).eq('id', user.id);
      // Soft deactivate from profiles
      await supabase.from('profiles').update({ is_deactivated: true }).eq('id', user.id);
      
      await logAdminAction({
        action: 'DEACTIVATE_USER',
        targetId: user.id,
        targetName: user.name,
        details: 'Account marked as deactivated by Administrator'
      });

      await fetchUsers();
      setConfirmAction(null);
      setSelectedUser(null);
      setToast({ message: 'Account deactivated successfully', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: 'Action failed: ' + err.message, type: 'error' });
    }
  };

  const handleCreateAccount = async () => {
    try {
      // Manual creation requires service role or signup
      // For now, we'll use a placeholder logic or prompt for invite
      setToast({ message: 'Manual creation is restricted to Auth Invite only', type: 'error' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };



  const handleInviteAdmin = async () => {
    setInviting(true);
    try {
      const { data: existingUser } = await supabase.from('profiles').select('id, role').eq('email', inviteEmail).single();
      
      if (existingUser) {
        if (existingUser.role === 'admin') throw new Error('This user is already an administrator.');
        
        // If user exists, promote them directly but log it as an invitation acceptance
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', existingUser.id);
      } else {
        // If user doesn't exist, create an invite record
        const { error: inviteError } = await supabase.from('admin_invites').insert({
          email: inviteEmail,
          status: 'pending'
        });
        if (inviteError) throw inviteError;
      }

      await logAdminAction({
        action: 'ADMIN_INVITE',
        targetName: inviteEmail,
        details: `Provisioned admin access request for ${inviteEmail}`,
      });

      await fetchUsers();
      setShowInviteModal(false);
      setInviteEmail('');
      setToast({ message: `Admin provisioning successful for ${inviteEmail}`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    try {
      const { error } = await supabase.from('admin_invites').delete().eq('id', inviteId);
      if (error) throw error;
      setToast({ message: 'Invitation cancelled', type: 'success' });
      await fetchUsers();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleRevokeAdmin = async (userId) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: 'donor' }).eq('id', userId);
      if (error) throw error;
      setToast({ message: 'Administrative access revoked', type: 'success' });
      await fetchUsers();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const filteredUsers = users.filter(u => {
    const searchLower = search.toLowerCase();
    const nameMatch = (u.name || '').toLowerCase().includes(searchLower);
    const emailMatch = (u.email || '').toLowerCase().includes(searchLower);
    const matchesSearch = nameMatch || emailMatch;

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'pending' && u.status === 'pending') ||
      (statusFilter === 'verified' && u.status === 'verified');

    let matchesTab = true;
    if (activeTab === 'active') matchesTab = !u.is_banned && !u.is_deactivated;
    else if (activeTab === 'verified') matchesTab = u.is_verified && !u.is_banned && !u.is_deactivated;
    else if (activeTab === 'restricted') matchesTab = u.is_banned === true;
    else if (activeTab === 'deactivated') matchesTab = u.is_deactivated === true;
    else if (activeTab === 'admins') matchesTab = u.role === 'admin';

    return matchesSearch && matchesRole && matchesStatus && matchesTab;
  });

  return (
    <AdminLayout title="Identity & Trust">
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Identity', value: users.length, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending Verif', value: pendingVerifications.length, icon: ShieldCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Active Admins', value: users.filter(u => u.role === 'admin').length, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Restricted', value: users.filter(u => u.is_banned).length, icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-lg font-black text-[#1A1A1A]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sophisticated Toolbar */}
        <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-2xl w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setStatusFilter('all');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                    ? 'bg-[#1A1A1A] text-white shadow-lg shadow-black/10'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-10 px-4 bg-gray-50 text-gray-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FE9800] hover:text-white transition-all flex items-center gap-2 border border-gray-100"
              >
                <Plus size={14} /> Provision
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
                className="h-10 px-4 bg-[#1A1A1A] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-md shadow-black/5"
              >
                <UserPlus size={14} /> Invite Admin
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                placeholder="Filter by name, email, or unique ID..."
                className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-transparent rounded-xl text-xs focus:bg-white focus:border-[#FE9800] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 md:w-32 h-11 px-3 bg-gray-50 border border-transparent rounded-xl text-[9px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-[#FE9800]"
              >
                <option value="all">Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
              </select>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="flex-1 md:w-32 h-11 px-3 bg-gray-50 border border-transparent rounded-xl text-[9px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-[#FE9800]"
              >
                <option value="all">Roles</option>
                <option value="donor">Donors</option>
                <option value="foodbank">Food Banks</option>
                <option value="barangay">Barangays</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* User List Container */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeTab === 'admins' ? (
                <>
                  {/* Admin Rows */}
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
                            <ShieldCheck size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-[#1A1A1A] uppercase tracking-tight">{u.name}</p>
                            <p className="text-[9px] text-gray-400 font-bold tracking-tight">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Administrator</span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active System Control</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button 
                          onClick={() => handleRevokeAdmin(u.id)}
                          className="h-8 px-3 bg-red-50 text-red-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Pending Invite Rows */}
                  {adminInvites.filter(inv => inv.status === 'pending').map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group bg-yellow-50/30">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 border border-yellow-200">
                            <Clock size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-tight italic">Invite Pending</p>
                            <p className="text-[9px] text-gray-400 font-bold tracking-tight">{inv.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-[8px] font-black uppercase tracking-widest text-yellow-600 bg-white border border-yellow-100 px-2 py-0.5 rounded">Provisioning</span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          Sent {new Date(inv.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button 
                          onClick={() => handleCancelInvite(inv.id)}
                          className="h-8 px-3 bg-white text-gray-400 rounded-lg text-[8px] font-black uppercase tracking-widest hover:text-red-600 hover:border-red-200 transition-all border border-gray-100"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              ) : activeTab === 'submissions' && (
                verifLoading ? (
                  [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-20 bg-gray-50/10" />)
                ) : (pendingVerifications || []).length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <ShieldCheck size={40} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-sm text-gray-400 font-black uppercase tracking-widest">No pending verification requests</p>
                    </td>
                  </tr>
                ) : (pendingVerifications || []).map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${v.type === 'foodbank' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                          {v.type === 'foodbank' ? <Building2 size={20} /> : <MapPin size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight">{v.profiles?.full_name || 'Organization'}</p>
                          <p className="text-[10px] text-gray-400 font-bold tracking-tight">{v.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${v.type === 'foodbank' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {v.type}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-amber-500">
                        <Clock size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Submitted {new Date(v.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => { setSelectedVerif(v); setShowVerifModal(true); }}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FE9800] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/10"
                      >
                        <ShieldCheck size={14} />
                        Review Docs
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {activeTab !== 'submissions' && (
                loading ? (
                  [1, 2, 3, 4, 5].map(i => <tr key={i} className="animate-pulse h-20 bg-gray-50/10" />)
                ) : filteredUsers.map((user) => (
                  <tr key={user.uniqueId} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${user.role === 'foodbank' ? 'bg-orange-50 text-orange-500' :
                          user.role === 'barangay' ? 'bg-blue-50 text-blue-500' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                          {user.role === 'foodbank' ? <Building2 size={20} /> :
                            user.role === 'barangay' ? <MapPin size={20} /> :
                              <User size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight">{user.name}</p>
                            {user.status === 'verified' && (
                              <BadgeCheck size={16} className="text-blue-500 fill-blue-50" />
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold tracking-tight">{user.email || 'NO_EMAIL_RECORDED'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${user.role === 'foodbank' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        user.role === 'barangay' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {user.is_banned ? (
                        <div className="flex items-center gap-2 text-red-500">
                          <Ban size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Access Suspended</span>
                        </div>
                      ) : user.status === 'pending' ? (
                        <div className="flex items-center gap-2 text-amber-500">
                          <AlertCircle size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Awaiting Verification</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle2 size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Active Partner</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {user.appeal && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppeal(user.appeal);
                              setSelectedUser(user);
                              setShowAppealModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 animate-pulse"
                            title="Pending Appeal"
                          >
                            <MessageCircle size={14} />
                            Appeal
                          </button>
                        )}
                        <button
                          onClick={() => { setSelectedUser(user); fetchUserHistory(user); }}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FE9800] transition-all shadow-lg shadow-black/5"
                        >
                          <FileText size={14} />
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && activeTab !== 'submissions' && filteredUsers.length === 0 && (
            <div className="py-20 text-center">
              <Search size={40} className="mx-auto text-gray-200 mb-4" />
              <p className="text-sm text-gray-400 font-black uppercase tracking-widest">No matching identities found</p>
            </div>
          )}
        </div>
      </div>

      {/* Verification Review Modal */}
      <Modal
        isOpen={showVerifModal}
        onClose={() => setShowVerifModal(false)}
        title="Verification Document Review"
        width="lg"
      >
        {selectedVerif && (
          <div className="space-y-8">
            <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100">
              <div className={`w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center ${selectedVerif.type === 'foodbank' ? 'text-[#FE9800]' : 'text-blue-500'} shadow-sm border border-gray-100`}>
                {selectedVerif.type === 'foodbank' ? <Building2 size={32} /> : <MapPin size={32} />}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-[#1A1A1A] uppercase tracking-tight">{selectedVerif.profiles?.full_name}</h3>
                <p className="text-xs text-gray-500 font-medium">{selectedVerif.profiles?.email}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white border border-gray-200 rounded-lg">{selectedVerif.type} Submission</span>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white border border-gray-200 rounded-lg">ID: {selectedVerif.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <FileText size={14} /> Official Documentation
              </h4>
              <div className="grid grid-cols-1 gap-6">
                {selectedVerif.type === 'foodbank' ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-white border border-gray-100 rounded-[2rem]">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Operating Permit / DTI / SEC</p>
                      <img src={selectedVerif.permit_url} className="w-full rounded-2xl border shadow-sm" alt="Permit" />
                      <a href={selectedVerif.permit_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[9px] font-black text-[#FE9800] uppercase mt-3 hover:underline">
                        <ExternalLink size={10} /> View Full Resolution
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 bg-white border border-gray-100 rounded-[2rem]">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Barangay ID / Certification</p>
                      <img src={selectedVerif.id_proof_url} className="w-full rounded-2xl border shadow-sm" alt="ID Proof" />
                      <a href={selectedVerif.id_proof_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[9px] font-black text-[#FE9800] uppercase mt-3 hover:underline">
                        <ExternalLink size={10} /> View Full Resolution
                      </a>
                    </div>
                  </div>
                )}
                <div className="p-6 bg-[#FE9800]/5 border border-[#FE9800]/10 rounded-[2rem]">
                  <p className="text-[10px] font-black text-[#FE9800] uppercase tracking-widest mb-2">Submission Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Submitted On</p>
                      <p className="text-xs font-bold">{new Date(selectedVerif.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Verification Type</p>
                      <p className="text-xs font-bold uppercase">{selectedVerif.type} Identity</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => handleApproveVerification(selectedVerif, 'rejected')}
                className="flex-1 h-16 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
              >
                Reject Documents
              </button>
              <button
                onClick={() => handleApproveVerification(selectedVerif, 'approved')}
                className="flex-[1.5] h-16 bg-[#FE9800] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                <BadgeCheck size={18} />
                Approve & Verify
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* User Inspection Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Identity Inspection"
        width="lg"
      >
        <div className="space-y-8">
          {/* Hero Profile */}
          <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100">
            <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-[#FE9800] shadow-sm border border-gray-100">
              {selectedUser?.role === 'foodbank' ? <Building2 size={32} /> :
                selectedUser?.role === 'barangay' ? <MapPin size={32} /> :
                  <User size={32} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-[#1A1A1A] uppercase tracking-tight">{selectedUser?.name}</h3>
                {selectedUser?.status === 'verified' && <BadgeCheck size={20} className="text-blue-500" />}
              </div>
              <p className="text-xs text-gray-500 font-medium">{selectedUser?.email}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white border border-gray-200 rounded-lg">{selectedUser?.role}</span>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white border border-gray-200 rounded-lg">ID: {selectedUser?.id.slice(0, 8)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedUser?.status === 'pending' && (
                <Button
                  onClick={() => setConfirmAction({ type: 'verify', user: selectedUser })}
                  className="shadow-xl shadow-orange-500/20 h-14 px-8"
                >
                  Verify Account
                </Button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditUser(selectedUser); setShowEditModal(true); }}
                  className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#FE9800] hover:border-[#FE9800] transition-all"
                  title="Edit Account"
                >
                  <Filter size={18} />
                </button>
                <button
                  onClick={() => setConfirmAction({ type: 'delete', user: selectedUser })}
                  className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-all"
                  title="Delete Account"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Docs & History Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <ShieldCheck size={14} /> Verification Documents
              </h4>
              <div className="p-6 bg-white border border-gray-100 rounded-[2rem] min-h-[200px] flex flex-col items-center justify-center text-center">
                {selectedUser?.permit_url || selectedUser?.id_proof_url ? (
                  <div className="space-y-4 w-full">
                    <img src={selectedUser.permit_url || selectedUser.id_proof_url} className="w-full rounded-xl border" alt="Permit" />
                    <a href={selectedUser.permit_url || selectedUser.id_proof_url} target="_blank" className="text-[10px] font-black text-[#FE9800] uppercase hover:underline">Download Official Copy</a>
                  </div>
                ) : (
                  <>
                    <FileText size={32} className="text-gray-200 mb-2" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase">No documents uploaded</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <History size={14} /> Activity Stream
              </h4>
              <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
                  {historyLoading ? (
                    <div className="p-8 text-center text-xs text-gray-400">Loading history...</div>
                  ) : userHistory.length > 0 ? userHistory.map((h, i) => (
                    <div key={i} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-black text-[#1A1A1A] uppercase">{h.item_name || h.items}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(h.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${h.status === 'distributed' || h.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'
                        }`}>{h.status}</span>
                    </div>
                  )) : (
                    <div className="p-12 text-center">
                      <TrendingUp size={24} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase">No transactions yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => { setShowBanModal(true); setSelectedUser(selectedUser); }}
              className="flex-1 h-14 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Ban size={16} /> Restrict Account
            </button>
            <button
              onClick={() => setSelectedUser(null)}
              className="flex-1 h-14 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </Modal>

      {/* Invite Admin Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="System Access Provisioning" width="sm">
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 text-blue-900">
            <ShieldCheck size={20} className="shrink-0" />
            <p className="text-[11px] font-medium leading-relaxed">
              Inviting a user as an administrator grants them full system control. Ensure the recipient is a trusted authority.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Target User Email</label>
            <input
              type="email"
              className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-[#FE9800] transition-all"
              placeholder="e.g. admin.team@angay.org"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <Button
            className="w-full h-14"
            onClick={handleInviteAdmin}
            loading={inviting}
            disabled={!inviteEmail.includes('@')}
          >
            Provision Admin Access
          </Button>
        </div>
      </Modal>

      {/* Ban Reason Modal */}
      <Modal isOpen={showBanModal} onClose={() => setShowBanModal(false)} title="Restrict Account" width="sm">
        <div className="space-y-6">
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3 text-red-900">
            <Ban size={20} className="shrink-0" />
            <p className="text-[11px] font-medium leading-relaxed">
              Restricting <span className="font-black">{selectedUser?.name}</span> will suspend their access to the logistics hub.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Ban Duration (Days)</label>
            <div className="grid grid-cols-4 gap-2">
              {['3', '7', '30', '365'].map(d => (
                <button
                  key={d}
                  onClick={() => setBanDuration(d)}
                  className={`h-12 rounded-xl text-[10px] font-black uppercase transition-all border ${banDuration === d ? 'bg-[#1A1A1A] text-white border-black' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                    }`}
                >
                  {d === '365' ? 'Year' : `${d}d`}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Custom days..."
              className="w-full h-12 px-5 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:border-red-500 transition-all mt-2"
              value={banDuration}
              onChange={(e) => setBanDuration(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Reason for Restriction</label>
            <textarea
              className="w-full h-32 p-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-red-500 transition-all resize-none"
              placeholder="Violation details..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowBanModal(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleBan} className="flex-1">Confirm Ban</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Account Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Update Account Profile" width="sm">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Display Name</label>
              <input
                className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-[#FE9800] transition-all"
                value={editUser?.name || ''}
                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Platform Role</label>
              <select
                className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-[#FE9800] transition-all"
                value={editUser?.role || ''}
                onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
              >
                <option value="donor">Donor</option>
                <option value="foodbank">Food Bank</option>
                <option value="barangay">Barangay</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>
          <Button className="w-full h-14" onClick={handleUpdateUser}>Save Changes</Button>
        </div>
      </Modal>

      {/* Provision Account Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Provision New Account" width="sm">
        <div className="space-y-6">
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3 text-orange-900">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-[11px] font-medium leading-relaxed">
              Manually creating accounts is intended for organizational onboarding. The user will still need to verify their email to set a password.
            </p>
          </div>
          <div className="space-y-4">
            <input
              placeholder="Full Name / Organization Name"
              className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-[#FE9800] transition-all"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
            <input
              placeholder="Email Address"
              type="email"
              className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-[#FE9800] transition-all"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
          </div>
          <Button className="w-full h-14" onClick={handleCreateAccount}>Provision Account</Button>
        </div>
      </Modal>

      {/* Custom Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title="Confirm Administrative Action"
        width="sm"
      >
        <div className="space-y-6 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${confirmAction?.type === 'delete' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-[#FE9800]'
            }`}>
            {confirmAction?.type === 'delete' ? <Trash2 size={40} /> : <ShieldCheck size={40} />}
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight">
              {confirmAction?.type === 'delete' ? 'Danger: Delete Account' : 'Trust Verification'}
            </h3>
            <p className="text-sm text-gray-500">
              {confirmAction?.type === 'delete'
                ? `Are you sure you want to permanently remove ${confirmAction?.user?.name}? This cannot be undone.`
                : `Verify ${confirmAction?.user?.name} for full platform access?`}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1 h-14" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              variant={confirmAction?.type === 'delete' ? 'danger' : 'primary'}
              className="flex-1 h-14"
              onClick={() => confirmAction?.type === 'delete' ? handleDeleteUser(confirmAction.user) : handleVerify(confirmAction.user)}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Custom Toast Message */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-10 duration-500">
          <div className={`px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-[#1A1A1A] text-white' : 'bg-red-600 text-white'
            }`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} className="text-[#FE9800]" /> : <AlertCircle size={18} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}
      {/* Appeal Review Modal */}
      <Modal isOpen={showAppealModal} onClose={() => setShowAppealModal(false)} title="Review Ban Appeal" width="sm">
        <div className="space-y-6">
          <div className="p-5 bg-orange-50 rounded-[2rem] border border-orange-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm">
                <MessageCircle size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#1A1A1A] uppercase">User Appeal Message</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Submitted {selectedAppeal && new Date(selectedAppeal.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
              "{selectedAppeal?.message}"
            </p>
          </div>

          <div className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Current Ban Context</h4>
            <p className="text-[11px] text-gray-600 font-bold mb-1">Reason: <span className="text-red-600">{selectedUser?.ban_reason}</span></p>
            <p className="text-[11px] text-gray-600 font-bold">Ends: {selectedUser?.banned_until ? new Date(selectedUser.banned_until).toLocaleDateString() : 'Permanent'}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowAppealModal(false)} className="flex-1">Keep Banned</Button>
            <Button variant="primary" onClick={() => handleLiftBan(selectedUser)} className="flex-1">Lift Ban & Restore Access</Button>
          </div>
        </div>
      </Modal>

    </AdminLayout>
  );
}
