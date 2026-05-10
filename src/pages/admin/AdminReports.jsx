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
  const [selectedReport, setSelectedReport] = useState(null);
  const [banReason, setBanReason] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Fetch reports error:', err);
      alert('Fetch error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (action) => {
    try {
      if (action === 'ban') {
        const table = selectedReport.reported_type === 'donor' ? 'profiles' : 
                      selectedReport.reported_type === 'foodbank' ? 'foodbanks' : 'barangays';
        
        await supabase.from(table).update({ 
          is_banned: true, 
          ban_reason: banReason || selectedReport.reason 
        }).eq('id', selectedReport.reported_id);
      }

      await supabase.from('reports').update({ 
        status: 'resolved'
      }).eq('id', selectedReport.id);
      
      await fetchReports();
      setSelectedReport(null);
      setBanReason('');
    } catch (err) {
      alert('Action failed: ' + err.message);
    }
  };

  return (
    <AdminLayout title="System Reports Ledger">
      <div className="space-y-8">
        
        {/* Simple Header */}
        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div>
            <h3 className="text-xl font-black text-[#1A1A1A] uppercase tracking-tight">Active Incident Reports</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Found {reports.length} incidents in global logs</p>
          </div>
          <button 
            onClick={fetchReports}
            className="h-14 px-8 bg-[#FE9800] text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-500 transition-all flex items-center gap-2"
          >
            Refresh Ledger
          </button>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="py-32 text-center bg-white rounded-[2.5rem] border border-gray-50">
              <div className="w-12 h-12 border-4 border-[#FE9800] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Accessing Secure Records...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-32 bg-white rounded-[3rem] border border-gray-100 text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight">System is Clean</h3>
              <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto mt-2">No incident reports found in the database.</p>
            </div>
          ) : reports.map((report) => (
            <div 
              key={report.id} 
              className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <ShieldAlert size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                        report.status === 'resolved' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {report.status || 'pending'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest">
                        <Calendar size={12} /> {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-[#1A1A1A] uppercase tracking-tight truncate">
                      {report.reason}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      Type: {report.reported_type} • ID: {report.reported_id}
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-[#FE9800] group-hover:text-white transition-all">
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
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

          {(!selectedReport?.status || selectedReport?.status === 'pending') && (
            <>
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
                <Button 
                  variant="ghost" 
                  onClick={() => handleAction('dismiss')} 
                  className="flex-1 h-14 text-[10px] font-black uppercase tracking-widest"
                >
                  Dismiss Report
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => handleAction('ban')} 
                  className="flex-1 h-14 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100"
                >
                  Restrict User
                </Button>
              </div>
            </>
          )}

          {selectedReport?.status === 'resolved' && (
            <div className="p-6 bg-green-50 rounded-[2rem] border border-green-100 text-center">
              <p className="text-xs font-black text-green-700 uppercase tracking-widest">Incident Resolved</p>
            </div>
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
}
