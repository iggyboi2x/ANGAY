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
  ExternalLink,
  Users
} from 'lucide-react';
import Modal from '../../components/Modal';
import VerifiedBadge from '../../components/VerifiedBadge';

const ACTION_CONFIG = {
  DONOR_PROPOSE: { label: 'Proposal Submitted', color: 'text-blue-500', bg: 'bg-blue-50', icon: Package },
  FOODBANK_ACCEPT: { label: 'Donation Accepted', color: 'text-green-500', bg: 'bg-green-50', icon: ShieldCheck },
  FOODBANK_PROPOSE: { label: 'Route Optimized', color: 'text-orange-500', bg: 'bg-orange-50', icon: Truck },
  BARANGAY_ACCEPT: { label: 'Transfer Verified', color: 'text-purple-500', bg: 'bg-purple-50', icon: Building2 },
  BARANGAY_DISTRIBUTE: { label: 'Aid Distributed', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
  EMERGENCY_SOS: { label: 'Distress Signal', color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle },
};

const DONATION_STAGES = [
  { id: 'pending', label: 'Proposed', icon: Package },
  { id: 'accepted', label: 'Accepted', icon: CheckCircle2 },
  { id: 'received', label: 'Received', icon: ShieldCheck },
];

const DISTRIBUTION_STAGES = [
  { id: 'pending', label: 'Proposed', icon: Truck },
  { id: 'accepted', label: 'Accepted', icon: ShieldCheck },
  { id: 'received', label: 'Received', icon: MapPin },
  { id: 'distributed', label: 'Distributed', icon: Users },
];

function LifecycleTracker({ currentStatus, stages, type }) {
  const currentIndex = stages.findIndex(s => s.id === currentStatus);
  const isRejected = currentStatus === 'rejected';

  return (
    <div className="flex items-center w-full px-4 py-6">
      {stages.map((stage, index) => {
        const isCompleted = index < currentIndex || (currentStatus !== 'pending' && index === currentIndex);
        const isCurrent = index === currentIndex;
        const Icon = stage.icon;

        return (
          <div key={stage.id} className="flex-1 flex items-center group/stage">
            <div className="flex flex-col items-center relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${isRejected ? 'bg-red-50 text-red-500 border-2 border-red-200' :
                  isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                    isCurrent ? 'bg-white text-[#FE9800] border-2 border-[#FE9800] ring-4 ring-[#FE9800]/10 scale-110' :
                      'bg-white text-gray-300 border-2 border-gray-100'
                }`}>
                <Icon size={18} />
              </div>
              <span className={`absolute -bottom-6 text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${isCurrent ? 'text-[#FE9800]' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                }`}>
                {stage.label}
              </span>
            </div>

            {index < stages.length - 1 && (
              <div className="flex-1 h-1 mx-2 bg-gray-50 rounded-full overflow-hidden relative translate-y-[-12px]">
                <div
                  className={`absolute inset-0 transition-all duration-1000 ${isRejected ? 'bg-red-200' : 'bg-emerald-500'
                    }`}
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminLogistics() {
  const [activeTab, setActiveTab] = useState('monitoring'); // 'stream' or 'monitoring'
  const [monitoringTab, setMonitoringTab] = useState('donations'); // 'donations' or 'distributions'
  const [ledger, setLedger] = useState([]);
  const [donations, setDonations] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ledgerRes, donationsRes, distributionsRes] = await Promise.all([
        supabase.from('global_activity_ledger').select('*').order('created_at', { ascending: false }),
        supabase.from('donations').select('*').order('created_at', { ascending: false }),
        supabase.from('distributions').select('*').order('created_at', { ascending: false })
      ]);

      if (ledgerRes.error) throw ledgerRes.error;

      // Process Ledger Verified Status
      const actorIds = [...new Set(ledgerRes.data?.map(l => l.actor_id) || [])];
      let ledgerData = ledgerRes.data || [];

      if (actorIds.length > 0) {
        const { data: actorProfiles } = await supabase.from('profiles').select('id, is_verified').in('id', actorIds);
        const verifiedMap = (actorProfiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p.is_verified }), {});
        ledgerData = ledgerData.map(entry => ({ ...entry, actor_verified: verifiedMap[entry.actor_id] || false }));
      }

      setLedger(ledgerData);
      setDonations(donationsRes.data || []);
      setDistributions(distributionsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLedger = ledger.filter(l =>
    l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.target_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Logistics & Supply Chain Monitoring">
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Main Navigation Tabs */}
        <div className="flex p-1.5 bg-gray-100 rounded-[2rem] w-fit mx-auto sm:mx-0">
          {[
            { id: 'monitoring', label: 'Supply Chain Tracker', icon: Activity },
            { id: 'stream', label: 'Global Activity Stream', icon: History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 h-12 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-[#FE9800] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'monitoring' ? (
          <div className="space-y-8">
            {/* Monitoring Sub-Tabs */}
            <div className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex gap-4">
                {[
                  { id: 'donations', label: 'Incoming Aid', icon: Package, desc: 'Donor to Foodbank' },
                  { id: 'distributions', label: 'Outgoing Relief', icon: Truck, desc: 'Foodbank to Barangay' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setMonitoringTab(tab.id)}
                    className={`flex flex-col items-start px-6 py-4 rounded-2xl border transition-all ${monitoringTab === tab.id
                        ? 'bg-[#FE9800]/5 border-[#FE9800] ring-4 ring-[#FE9800]/5'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <tab.icon size={18} className={monitoringTab === tab.id ? 'text-[#FE9800]' : 'text-gray-400'} />
                      <span className={`text-xs font-black uppercase tracking-tight ${monitoringTab === tab.id ? 'text-[#1A1A1A]' : 'text-gray-400'}`}>
                        {tab.label}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{tab.desc}</p>
                  </button>
                ))}
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Status Overview</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-[9px] font-black text-gray-500 uppercase">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[9px] font-black text-gray-500 uppercase">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[9px] font-black text-gray-500 uppercase">Completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monitoring Grid */}
            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-[2.5rem] animate-pulse" />)
              ) : (monitoringTab === 'donations' ? donations : distributions).length === 0 ? (
                <div className="py-20 bg-white rounded-[2.5rem] border border-gray-100 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <ShieldCheck size={32} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No active {monitoringTab} tracked</p>
                </div>
              ) : (monitoringTab === 'donations' ? donations : distributions).map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                  onClick={() => setSelectedMonitoring({ ...item, type: monitoringTab })}
                >
                  <div className="flex items-center gap-8">
                    {/* Status Badge */}
                    <div className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center border-2 shrink-0 ${item.status === 'pending' ? 'bg-yellow-50 border-yellow-100 text-yellow-600' :
                        item.status === 'accepted' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                          (item.status === 'received' || item.status === 'distributed') ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                            'bg-red-50 border-red-100 text-red-600'
                      }`}>
                      <p className="text-[8px] font-black uppercase tracking-widest mb-1">Status</p>
                      <span className="text-[10px] font-black uppercase tracking-tight">{item.status}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
                          ID: {item.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">From</p>
                          <h4 className="text-base font-black text-[#1A1A1A] uppercase tracking-tight truncate">
                            {monitoringTab === 'donations' ? item.donor_name : item.foodbank_name}
                          </h4>
                        </div>
                        <ArrowRight size={20} className="text-gray-200" />
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">To</p>
                          <h4 className="text-base font-black text-[#1A1A1A] uppercase tracking-tight truncate">
                            {monitoringTab === 'donations' ? item.foodbank_name : item.barangay_name}
                          </h4>
                        </div>
                      </div>

                      {/* Iconic Lifecycle Tracker */}
                      <div className="mt-2">
                        <LifecycleTracker
                          currentStatus={item.status}
                          stages={monitoringTab === 'donations' ? DONATION_STAGES : DISTRIBUTION_STAGES}
                          type={monitoringTab}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Package size={16} />
                        <span className="text-xs font-bold">{item.items?.split(',').length || 0} Items</span>
                      </div>
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:bg-[#FE9800] group-hover:text-white transition-all">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
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
                <button onClick={fetchData} className="text-[10px] font-black text-[#FE9800] uppercase tracking-widest hover:underline">Refresh Stream</button>
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
                            <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded-md">
                              <span className="text-[11px] font-black text-[#1A1A1A] uppercase tracking-tighter">
                                {entry.actor_name}
                              </span>
                              <VerifiedBadge isVerified={entry.actor_verified} size={11} />
                            </div>

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
        )}
      </div>

      {/* Monitoring Details Modal */}
      <Modal
        isOpen={!!selectedMonitoring}
        onClose={() => setSelectedMonitoring(null)}
        title={`${selectedMonitoring?.type === 'donations' ? 'Incoming Donation' : 'Outgoing Relief'} Details`}
        width="md"
      >
        <div className="space-y-8">
          <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${selectedMonitoring?.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                selectedMonitoring?.status === 'accepted' ? 'bg-blue-50 text-blue-600' :
                  'bg-emerald-50 text-emerald-600'
              }`}>
              <Activity size={28} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Current Logistics Stage</p>
              <h4 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight">{selectedMonitoring?.status}</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Last Updated: {new Date(selectedMonitoring?.updated_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Origin</p>
              <p className="text-sm font-black text-[#1A1A1A] uppercase truncate">{selectedMonitoring?.donor_name || selectedMonitoring?.foodbank_name}</p>
            </div>
            <div className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Destination</p>
              <p className="text-sm font-black text-[#1A1A1A] uppercase truncate">{selectedMonitoring?.foodbank_name || selectedMonitoring?.barangay_name}</p>
            </div>
          </div>

          <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Items Manifest</h5>
            <div className="space-y-3">
              {selectedMonitoring?.items?.split(',').map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-700 uppercase">{item.trim()}</span>
                  <CheckCircle2 size={14} className="text-green-500" />
                </div>
              ))}
            </div>
          </div>

          {selectedMonitoring?.notes && (
            <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Logistics Notes</h5>
              <p className="text-sm text-gray-600 leading-relaxed italic">"{selectedMonitoring.notes}"</p>
            </div>
          )}

          {selectedMonitoring?.proof_images && selectedMonitoring.proof_images.length > 0 && (
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Delivery Proof</p>
              <div className="grid grid-cols-2 gap-3">
                {selectedMonitoring.proof_images.map((img, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 aspect-square">
                    <img src={img} alt="Proof" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {selectedMonitoring.proof_description && (
                <p className="text-xs text-gray-500 font-medium px-4">{selectedMonitoring.proof_description}</p>
              )}
            </div>
          )}

          {(!selectedMonitoring?.proof_images || selectedMonitoring.proof_images.length === 0) && selectedMonitoring?.status === 'distributed' && (
            <div className="p-8 bg-red-50 rounded-[2.5rem] border border-red-100 text-center">
              <AlertCircle size={32} className="mx-auto text-red-500 mb-2" />
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Missing Proof of Distribution</p>
            </div>
          )}

          <button
            onClick={() => setSelectedMonitoring(null)}
            className="w-full h-16 bg-[#1A1A1A] text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-black"
          >
            Close Tracker
          </button>
        </div>
      </Modal>

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
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${ACTION_CONFIG[selectedEntry?.action_type]?.bg || 'bg-white'
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
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight truncate">{selectedEntry?.actor_name}</p>
                <VerifiedBadge isVerified={Array.isArray(selectedEntry?.profiles) ? selectedEntry?.profiles[0]?.is_verified : selectedEntry?.profiles?.is_verified} size={14} />
              </div>
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

