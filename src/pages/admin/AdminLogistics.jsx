import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../../supabase';
import { 
  Search, 
  Package, 
  Truck, 
  Image as ImageIcon, 
  MapPin, 
  User, 
  Calendar,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Modal from '../../components/Modal';

export default function AdminLogistics() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewingProof, setViewingProof] = useState(null);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('donations')
        .select(`
          *,
          foodbanks:foodbank_id(org_name),
          barangays:barangay_id(barangay_name)
        `)
        .order('created_at', { ascending: false });
      
      setDonations(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const filteredDonations = donations.filter(d => 
    d.item_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.foodbanks?.org_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Global Logistics Ledger">
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Search Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by item, food bank, or tracking ID..."
              className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-[1.5rem] text-sm focus:outline-none focus:ring-2 focus:ring-[#FE9800]/10 focus:border-[#FE9800] transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Global Ledger Table */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Manifest Item</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Route</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6 h-20 bg-gray-50/20" />
                  </tr>
                ))
              ) : filteredDonations.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#FE9800] group-hover:text-white transition-all shadow-sm">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#1A1A1A] group-hover:text-[#FE9800] transition-colors uppercase tracking-tight">{d.item_name || 'Mixed Items'}</p>
                        <p className="text-[10px] text-gray-400 font-bold tracking-tight uppercase tracking-widest">ID: {d.id.slice(0,8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${d.barangay_id ? 'bg-orange-500' : 'bg-blue-500'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${d.barangay_id ? 'text-orange-600' : 'text-blue-600'}`}>
                        {d.barangay_id ? 'Targeted Package' : 'General Inventory'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                        <Building2 size={12} className="text-[#FE9800]" />
                        <span className="uppercase tracking-widest">{d.foodbanks?.org_name}</span>
                      </div>
                      <ChevronRight size={10} className="ml-1 text-gray-300" />
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                        <MapPin size={12} className="text-blue-500" />
                        <span className="uppercase tracking-widest">{d.barangays?.barangay_name || 'Stockpile'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className={d.status === 'distributed' ? 'text-green-500' : 'text-gray-300'} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${d.status === 'distributed' ? 'text-green-600' : 'text-gray-400'}`}>
                        {d.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {d.proof_url ? (
                      <button 
                        onClick={() => setViewingProof(d)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-[#1A1A1A] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                      >
                        <ImageIcon size={14} /> View
                      </button>
                    ) : (
                      <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">No Proof</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Modal */}
      <Modal 
        isOpen={!!viewingProof} 
        onClose={() => setViewingProof(null)} 
        title="Proof of Distribution"
        width="md"
      >
        <div className="space-y-6">
          <div className="rounded-[2rem] overflow-hidden border border-gray-100 shadow-lg aspect-video bg-gray-50">
            <img 
              src={viewingProof?.proof_url} 
              alt="Proof" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Distributed To</p>
              <p className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight">{viewingProof?.barangays?.barangay_name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Timestamp</p>
              <p className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight">
                {viewingProof && new Date(viewingProof.updated_at || viewingProof.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setViewingProof(null)}
            className="w-full h-14 bg-[#1A1A1A] text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10"
          >
            Dismiss View
          </button>
        </div>
      </Modal>

    </AdminLayout>
  );
}

function Building2({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
