import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  Mail, 
  Search, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Building2, 
  User,
  Filter,
  MoreVertical,
  ChevronRight
} from 'lucide-react';

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, reviewed
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (err) {
      console.error('Fetch inquiries error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setInquiries(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
      if (selectedInquiry?.id === id) setSelectedInquiry(prev => ({ ...prev, status }));
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInquiries(prev => prev.filter(inv => inv.id !== id));
      setSelectedInquiry(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const filtered = inquiries.filter(inv => {
    const matchesSearch = 
      inv.full_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.email.toLowerCase().includes(search.toLowerCase()) ||
      (inv.organization || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'all' || inv.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <AdminLayout title="System Inquiries">
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Toolbar */}
        <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                placeholder="Search by name, email, or organization..."
                className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-transparent rounded-xl text-xs focus:bg-white focus:border-[#FE9800] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 md:w-36 h-11 px-3 bg-gray-50 border border-transparent rounded-xl text-[9px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-[#FE9800]"
              >
                <option value="all">All Entries</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
              </select>
              <button 
                onClick={fetchInquiries}
                className="h-11 px-4 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all"
              >
                <Clock size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* List View */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact</th>
                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Organization</th>
                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="4" className="px-8 py-6 h-20 bg-gray-50/50"></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-20 text-center">
                        <Mail size={40} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-sm text-gray-400 font-black uppercase tracking-widest">No inquiries found</p>
                      </td>
                    </tr>
                  ) : filtered.map((inv) => (
                    <tr 
                      key={inv.id} 
                      onClick={() => setSelectedInquiry(inv)}
                      className={`hover:bg-gray-50/50 transition-colors cursor-pointer group ${selectedInquiry?.id === inv.id ? 'bg-orange-50/30' : ''}`}
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${inv.status === 'pending' ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-400'}`}>
                            <User size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-[#1A1A1A] uppercase tracking-tight">{inv.full_name}</p>
                            <p className="text-[9px] text-gray-400 font-bold tracking-tight">{inv.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={12} className="text-gray-300" />
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{inv.organization || 'Individual'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'pending' ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${inv.status === 'pending' ? 'text-orange-600' : 'text-emerald-600'}`}>
                            {inv.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <ChevronRight size={16} className={`text-gray-300 transition-transform group-hover:translate-x-1 ${selectedInquiry?.id === inv.id ? 'rotate-90' : ''}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details View */}
          <div className="lg:col-span-1">
            {selectedInquiry ? (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden sticky top-8 animate-in slide-in-from-right duration-500">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center shadow-lg shadow-black/10">
                      <Mail size={24} />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDelete(selectedInquiry.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-[#1A1A1A] uppercase tracking-tight">{selectedInquiry.full_name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedInquiry.organization || 'Individual Inquiry'}</p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-50">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Email Address</p>
                      <p className="text-sm font-bold text-blue-600 underline">{selectedInquiry.email}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Received At</p>
                      <p className="text-xs text-gray-600">{new Date(selectedInquiry.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Inquiry Message</p>
                    <div className="bg-gray-50 p-6 rounded-2xl">
                      <p className="text-sm text-slate-600 leading-relaxed italic">
                        "{selectedInquiry.message}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-8 flex gap-3">
                    {selectedInquiry.status === 'pending' ? (
                      <button 
                        onClick={() => handleUpdateStatus(selectedInquiry.id, 'reviewed')}
                        className="flex-1 h-12 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={14} /> Mark as Reviewed
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateStatus(selectedInquiry.id, 'pending')}
                        className="flex-1 h-12 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Clock size={14} /> Reopen Inquiry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200 p-12 text-center">
                <Mail size={40} className="mx-auto text-gray-200 mb-4" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Select an inquiry to view details</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
