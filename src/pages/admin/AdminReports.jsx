import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../../supabase';
import { 
  AlertOctagon, 
  Search, 
  Filter, 
  User, 
  MessageSquare, 
  Calendar, 
  ChevronRight, 
  Ban, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [banReason, setBanReason] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      setReports(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (action) => {
    if (action === 'ban') {
      console.log(`Banning user based on report ${selectedReport.id}: ${banReason}`);
    } else {
      console.log(`Dismissing report ${selectedReport.id}`);
    }
    setShowResolveModal(false);
    setBanReason('');
    setSelectedReport(null);
  };

  return (
    <AdminLayout title="Reports & Ban Workflow">
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Reports Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by reported user or incident details..."
              className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-[1.5rem] text-sm focus:outline-none focus:ring-2 focus:ring-[#FE9800]/10 focus:border-[#FE9800] transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="h-14 px-6 bg-white border border-gray-100 rounded-[1.5rem] flex items-center gap-3 text-gray-500 hover:bg-gray-50 transition-all shadow-sm">
            <Filter size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Priority</span>
          </button>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-32 bg-gray-50 animate-pulse rounded-[2rem]" />)
          ) : reports.map((report) => (
            <div 
              key={report.id} 
              className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-sm group-hover:scale-110 transition-transform shrink-0">
                    <ShieldAlert size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest px-2 py-1 bg-red-50 rounded-lg border border-red-100">
                        Pending Review
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest">
                        <Calendar size={12} /> {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-[#1A1A1A] uppercase tracking-tight truncate">
                      Incident: {report.reason}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      Reported ID: {report.reported_id.slice(0, 8)} • Type: {report.reported_type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reporter</p>
                    <p className="text-xs font-bold text-[#1A1A1A]">User ID: {report.reporter_id?.slice(0,8)}</p>
                  </div>
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-[#FE9800] group-hover:text-white transition-all">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && reports.length === 0 && (
          <div className="py-32 bg-white rounded-[3rem] border border-gray-100 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight">System is Clean</h3>
            <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto mt-2">
              No active reports require administrative attention.
            </p>
          </div>
        )}
      </div>

      {/* Report Resolution Modal */}
      <Modal 
        isOpen={!!selectedReport} 
        onClose={() => setSelectedReport(null)} 
        title="Resolve Incident Report"
        width="md"
      >
        <div className="space-y-6">
          <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100">
            <h5 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3">Incident Description</h5>
            <p className="text-sm text-red-900 leading-relaxed font-medium">
              {selectedReport?.reason}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Evidence / Proof</label>
            {selectedReport?.proof_url ? (
              <div className="rounded-2xl overflow-hidden border border-gray-100 aspect-video bg-gray-50">
                <img src={selectedReport.proof_url} alt="Proof" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="p-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                <p className="text-xs text-gray-400 font-medium italic">No visual evidence provided.</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Resolution Action</label>
            <textarea 
              className="w-full h-32 p-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE9800]/10 focus:border-[#FE9800] transition-all resize-none"
              placeholder="If banning, specify policy violation details..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setSelectedReport(null)} className="flex-1 h-14 text-[10px] font-black uppercase tracking-widest">Dismiss</Button>
            <Button 
              variant="danger" 
              onClick={() => handleAction('ban')} 
              className="flex-1 h-14 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100"
            >
              Restrict User
            </Button>
          </div>
        </div>
      </Modal>

    </AdminLayout>
  );
}
