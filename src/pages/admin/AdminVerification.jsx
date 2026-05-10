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
  Plus
} from 'lucide-react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const TABS = [
  { id: 'active', label: 'Active Users', icon: User },
  { id: 'verified', label: 'Verified Accounts', icon: BadgeCheck },
  { id: 'restricted', label: 'Restricted Accounts', icon: Ban },
];

export default function AdminVerification() {
  const [activeTab, setActiveTab] = useState('active');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, verified
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // CRUD States
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'donor', contact: '' });
  const [confirmAction, setConfirmAction] = useState(null); // { type, user }
  const [toast, setToast] = useState(null); // { message, type }

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [
        { data: profiles },
        { data: foodbanks },
        { data: barangays }
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('foodbanks').select('id, org_name, logo_url'),
        supabase.from('barangays').select('id, barangay_name, barangay_profile')
      ]);

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

  useEffect(() => {
    fetchUsers();
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
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_banned: true, ban_reason: banReason })
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      if (selectedUser.role === 'foodbank') {
        await supabase.from('foodbanks').update({ is_banned: true, ban_reason: banReason }).eq('id', selectedUser.id);
      } else if (selectedUser.role === 'barangay') {
        await supabase.from('barangays').update({ is_banned: true, ban_reason: banReason }).eq('id', selectedUser.id);
      }

      try {
        await supabase.from('admin_logs').insert({
          action: 'BAN',
          target_id: selectedUser.id,
          details: `Banned ${selectedUser.name} (${selectedUser.role}) for: ${banReason}`
        });
      } catch (logErr) {
        console.warn('Logging skipped: admin_logs table not found');
      }

      setShowBanModal(false);
      setBanReason('');
      setSelectedUser(null);
      await fetchUsers();
      setToast({ message: `Account ${selectedUser.name} restricted`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: 'Ban failed: ' + err.message, type: 'error' });
    }
  };

  const handleVerify = async (user) => {
    try {
      console.log('Attempting to verify user:', user.id, user.name);
      
      // 1. Update the primary Profiles record
      const { data, error, count } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No rows updated. Please check if your account has Admin RLS permissions.');
      }

      console.log('Verification successful in DB:', data[0]);

      // 2. Log the administrative action (Silent fail if table missing)
      try {
        await supabase.from('admin_logs').insert({
          action: 'VERIFY',
          target_id: user.id,
          details: `Verified ${user.name} (${user.role})`
        });
      } catch (logErr) {
        console.warn('Logging skipped: admin_logs table not found');
      }

      await fetchUsers();
      setSelectedUser(null);
      setConfirmAction(null);
      setToast({ message: `${user.name} verified successfully!`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Verification detailed error:', err);
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
        .eq('id', editUser.id);

      if (error) throw error;

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
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;

      await fetchUsers();
      setConfirmAction(null);
      setSelectedUser(null);
      setToast({ message: 'Account removed from system', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: 'Deletion failed: ' + err.message, type: 'error' });
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
      const { data, error } = await supabase.from('profiles').select('id').eq('email', inviteEmail).single();
      if (error || !data) throw new Error('User not found. They must have a donor account first.');

      // Update role to admin
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.id);

      await supabase.from('admin_logs').insert({
        action: 'ADMIN_PROMOTE',
        target_id: data.id,
        details: `Promoted ${inviteEmail} to Administrator role.`
      });

      alert(`Admin invite successful for ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (err) {
      alert(err.message);
    } finally {
      setInviting(false);
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
    if (activeTab === 'active') matchesTab = !u.is_banned;
    else if (activeTab === 'verified') matchesTab = u.is_verified && !u.is_banned;
    else if (activeTab === 'restricted') matchesTab = u.is_banned === true;

    return matchesSearch && matchesRole && matchesStatus && matchesTab;
  });

  return (
    <AdminLayout title="Identity & Trust">
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-[1.5rem] w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setStatusFilter('all');
                }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                    ? 'bg-white text-[#FE9800] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 px-4 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#FE9800]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-12 px-4 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#FE9800]"
            >
              <option value="all">All Roles</option>
              <option value="donor">Donors</option>
              <option value="foodbank">Food Banks</option>
              <option value="barangay">Barangays</option>
              <option value="admin">Admins</option>
            </select>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="h-12 px-6 bg-[#FE9800] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/10"
            >
              <Plus size={14} />
              Provision Account
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="h-12 px-6 bg-[#1A1A1A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-black/5"
            >
              <UserPlus size={14} />
              Invite Admin
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or unique identification..."
            className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-[1.5rem] text-sm focus:outline-none focus:ring-2 focus:ring-[#FE9800]/10 focus:border-[#FE9800] transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
              {loading ? (
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
                    <button
                      onClick={() => { setSelectedUser(user); fetchUserHistory(user); }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FE9800] transition-all shadow-lg shadow-black/5"
                    >
                      <FileText size={14} />
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredUsers.length === 0 && (
            <div className="py-20 text-center">
              <Search size={40} className="mx-auto text-gray-200 mb-4" />
              <p className="text-sm text-gray-400 font-black uppercase tracking-widest">No matching identities found</p>
            </div>
          )}
        </div>
      </div>

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
          <textarea
            className="w-full h-32 p-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-red-500 transition-all resize-none"
            placeholder="Violation details..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
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
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
            confirmAction?.type === 'delete' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-[#FE9800]'
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
          <div className={`px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-[#1A1A1A] text-white' : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} className="text-[#FE9800]" /> : <AlertCircle size={18} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
