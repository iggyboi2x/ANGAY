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
  UserPlus
} from 'lucide-react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const TABS = [
  { id: 'queue', label: 'Verification Queue', icon: ShieldCheck },
  { id: 'users', label: 'User Directory', icon: User },
  { id: 'admins', label: 'Admin Access', icon: ShieldCheck }
];

export default function AdminVerification() {
  const [activeTab, setActiveTab] = useState('queue');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration, in real app we'd fetch from profiles, foodbanks, barangays
      const { data: profiles } = await supabase.from('profiles').select('*').limit(20);
      const { data: foodbanks } = await supabase.from('foodbanks').select('*').limit(20);
      const { data: barangays } = await supabase.from('barangays').select('*').limit(20);

      const combined = [
        ...(profiles || []).map(p => ({ ...p, role: 'donor', name: p.full_name, status: 'verified' })),
        ...(foodbanks || []).map(f => ({ ...f, role: 'foodbank', name: f.org_name, status: f.is_verified ? 'verified' : 'pending' })),
        ...(barangays || []).map(b => ({ ...b, role: 'barangay', name: b.barangay_name, status: 'verified' }))
      ];
      setUsers(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleVerify = async (user) => {
    // Update logic for Supabase
    alert(`Verified ${user.name}`);
  };

  const handleBan = async () => {
    // Ban logic with reason logging
    console.log(`Banning ${selectedUser.name} for: ${banReason}`);
    setShowBanModal(false);
    setBanReason('');
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Identity & Trust">
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Sub-Header Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-[1.5rem] w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-[#FE9800] shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by name, role, or ID..."
              className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-[1.5rem] text-sm focus:outline-none focus:ring-2 focus:ring-[#FE9800]/10 focus:border-[#FE9800] transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="h-14 px-6 bg-white border border-gray-100 rounded-[1.5rem] flex items-center gap-3 text-gray-500 hover:bg-gray-50 transition-all">
            <Filter size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Filter</span>
          </button>
          {activeTab === 'admins' && (
            <button className="h-14 px-6 bg-[#1A1A1A] text-white rounded-[1.5rem] flex items-center gap-3 hover:bg-black transition-all shadow-lg shadow-black/5">
              <UserPlus size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Invite Admin</span>
            </button>
          )}
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-8 py-6 h-20 bg-gray-50/20" />
                  </tr>
                ))
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        user.role === 'foodbank' ? 'bg-orange-50 text-orange-500' :
                        user.role === 'barangay' ? 'bg-blue-50 text-blue-500' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {user.role === 'foodbank' ? <Building2 size={20} /> :
                         user.role === 'barangay' ? <MapPin size={20} /> :
                         <User size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#1A1A1A] group-hover:text-[#FE9800] transition-colors uppercase tracking-tight">{user.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold tracking-tight">{user.email || 'no-email@angay.org'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      user.role === 'foodbank' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      user.role === 'barangay' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-gray-50 text-gray-500 border-gray-100'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {user.status === 'pending' ? (
                      <div className="flex items-center gap-2 text-amber-500">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Pending Review</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Verified Account</span>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.status === 'pending' && (
                        <button 
                          onClick={() => handleVerify(user)}
                          className="p-2.5 bg-[#FE9800] text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                          title="Approve Verification"
                        >
                          <ShieldCheck size={18} />
                        </button>
                      )}
                      <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all">
                        <ExternalLink size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedUser(user); setShowBanModal(true); }}
                        className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        <Ban size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredUsers.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Search size={32} />
              </div>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Ban Reason Modal */}
      <Modal isOpen={showBanModal} onClose={() => setShowBanModal(false)} title="Restrict Account" width="sm">
        <div className="space-y-6">
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3">
            <Ban className="text-red-600 shrink-0" size={20} />
            <p className="text-[11px] text-red-900 leading-relaxed font-medium">
              You are about to restrict <span className="font-bold">{selectedUser?.name}</span>. This action will be logged and the user will be notified of the reason.
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Ban Reason</label>
            <textarea 
              className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all resize-none"
              placeholder="Enter specific policy violations..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowBanModal(false)} className="flex-1">Cancel</Button>
            <Button 
              variant="danger" 
              onClick={handleBan} 
              disabled={!banReason.trim()}
              className="flex-1"
            >
              Confirm Ban
            </Button>
          </div>
        </div>
      </Modal>

    </AdminLayout>
  );
}
