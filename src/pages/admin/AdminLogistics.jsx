import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../../supabase';
import { 
  Search, 
  Package, 
  Truck, 
  MapPin, 
  User, 
  Calendar,
  CheckCircle2,
  ChevronRight,
  Building2,
  ArrowRight,
  History,
  Activity,
  ShieldCheck,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import Modal from '../../components/Modal';

const ACTION_CONFIG = {
  DONOR_PROPOSE: { label: 'Proposal Submitted', color: 'text-blue-500', bg: 'bg-blue-50', icon: Package },
  FOODBANK_ACCEPT: { label: 'Donation Accepted', color: 'text-green-500', bg: 'bg-green-50', icon: ShieldCheck },
  FOODBANK_PROPOSE: { label: 'Route Optimized', color: 'text-orange-500', bg: 'bg-orange-50', icon: Truck },
  BARANGAY_ACCEPT: { label: 'Transfer Verified', color: 'text-purple-500', bg: 'bg-purple-50', icon: Building2 },
  BARANGAY_DISTRIBUTE: { label: 'Aid Distributed', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
  EMERGENCY_SOS: { label: 'Distress Signal', color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle },
};

export default function AdminLogistics() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('global_activity_ledger')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLedger(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const filteredLedger = ledger.filter(l => 
    l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.target_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase())
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
              placeholder="Search lifecycle by actor, target, or manifest details..."
              className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-[1.5rem] text-sm focus:outline-none focus:ring-2 focus:ring-[#FE9800]/10 focus:border-[#FE9800] transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Global Ledger Grid */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Supply Chain Traceability</h3>
            <button onClick={fetchLedger} className="text-[10px] font-black text-[#FE9800] uppercase tracking-widest hover:underline">Refresh Stream</button>
          </div>

          <div className="divide-y divide-gray-50">
            {loading ? (
              [1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 animate-pulse bg-gray-50/20" />)
            ) : filteredLedger.length === 0 ? (
              <div className="py-20 text-center">
                <Activity size={40} className="mx-auto text-gray-200 mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No activity recorded in supply chain</p>
              </div>
            ) : filteredLedger.map((entry) => {
              const config = ACTION_CONFIG[entry.action_type] || { label: entry.action_type, color: 'text-gray-500', bg: 'bg-gray-50', icon: History };
              const Icon = config.icon;

              return (
                <div 
                  key={entry.id} 
                  className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-all cursor-pointer group"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform relative`}>
                      <Icon size={28} />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[8px] font-black shadow-sm uppercase">
                        {entry.actor_role[0]}
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
                        {/* WHO */}
                        <span className="text-[11px] font-black text-[#1A1A1A] uppercase tracking-tighter bg-gray-100 px-2 py-0.5 rounded-md">
                          {entry.actor_name}
                        </span>
                        
                        {/* WHAT */}
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">performed</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>
                          {config.label}
                        </span>

                        {/* TO WHOM */}
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">to</span>
                        <span className="text-[11px] font-black text-[#1A1A1A] uppercase tracking-tighter bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                          {entry.target_name || 'System'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500 font-medium line-clamp-1 max-w-xl">
                        {entry.details}
                      </p>

                      {/* WHEN */}
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Clock size={12} /> {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden lg:block">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Source Point</p>
                      <p className="text-[11px] font-black text-[#1A1A1A] uppercase">{entry.actor_role}</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-[#FE9800] group-hover:text-white transition-all shadow-sm">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lifecycle Inspector Modal */}
      <Modal 
        isOpen={!!selectedEntry} 
        onClose={() => setSelectedEntry(null)} 
        title="Supply Chain Traceability Insight"
        width="md"
      >
        <div className="space-y-8 animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Activity size={80} />
             </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
              ACTION_CONFIG[selectedEntry?.action_type]?.bg || 'bg-white'
            } ${ACTION_CONFIG[selectedEntry?.action_type]?.color || 'text-gray-500'}`}>
              {selectedEntry && (() => {
                const Icon = ACTION_CONFIG[selectedEntry.action_type]?.icon || History;
                return <Icon size={28} />;
              })()}
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Lifecycle Event</p>
              <h4 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight">{ACTION_CONFIG[selectedEntry?.action_type]?.label}</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={10} /> {new Date(selectedEntry?.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Actor & Target Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mb-4">
                <User size={16} className="text-gray-400" />
              </div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Executing Actor</p>
              <p className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight truncate">{selectedEntry?.actor_name}</p>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#FE9800]/10 text-[#FE9800] rounded-md mt-3 inline-block tracking-widest">{selectedEntry?.actor_role}</span>
            </div>
            <div className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mb-4">
                <MapPin size={16} className="text-gray-400" />
              </div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Entity</p>
              <p className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight truncate">{selectedEntry?.target_name || 'System'}</p>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-500 rounded-md mt-3 inline-block tracking-widest">
                {selectedEntry?.target_id ? `ID: ${selectedEntry.target_id.slice(0, 8)}` : 'NETWORK'}
              </span>
            </div>
          </div>

          {/* Manifest Details */}
          <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-4 bg-[#FE9800] rounded-full" />
                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manifest / Details</h5>
              </div>
              <p className="text-base text-[#1A1A1A] leading-relaxed font-bold uppercase tracking-tight">
                {selectedEntry?.details}
              </p>
            </div>

            {selectedEntry?.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
              <div className="pt-6 border-t border-gray-50 grid grid-cols-2 gap-y-4">
                {Object.entries(selectedEntry.metadata).map(([key, val]) => {
                  if (key === 'proof_url' || key === 'items') return null;
                  return (
                    <div key={key}>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</p>
                      <p className="text-xs font-bold text-gray-700">{val || 'N/A'}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedEntry?.metadata?.proof_url && (
              <div className="space-y-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Visual Verification</p>
                <div className="rounded-[1.5rem] overflow-hidden border border-gray-100 aspect-video bg-gray-50 group cursor-zoom-in">
                  <img src={selectedEntry.metadata.proof_url} alt="Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setSelectedEntry(null)}
            className="w-full h-16 bg-[#1A1A1A] text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95"
          >
            Dismiss Insight
          </button>
        </div>
      </Modal>

    </AdminLayout>
  );
}

