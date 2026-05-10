import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../../supabase';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  ShieldCheck, 
  Ban, 
  Settings, 
  UserPlus, 
  Radio,
  Clock,
  ExternalLink
} from 'lucide-react';

const ACTION_ICONS = {
  VERIFY: { icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-50' },
  BAN: { icon: Ban, color: 'text-red-500', bg: 'bg-red-50' },
  UNBAN: { icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
  RESOLVE_CRISIS: { icon: Radio, color: 'text-orange-500', bg: 'bg-orange-50' },
  ADMIN_PROMOTE: { icon: UserPlus, color: 'text-purple-500', bg: 'bg-purple-50' },
  UPDATE_USER: { icon: Settings, color: 'text-gray-500', bg: 'bg-gray-50' },
  DELETE_USER: { icon: Ban, color: 'text-red-900', bg: 'bg-red-50' },
};

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Audit fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    (log.target_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.details?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.admin_name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="System Audit Logs">
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Log Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search logs by admin, target, or specific event details..."
              className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-[1.5rem] text-sm focus:outline-none focus:ring-2 focus:ring-[#FE9800]/10 focus:border-[#FE9800] transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="h-14 px-6 bg-white border border-gray-100 rounded-[1.5rem] flex items-center gap-3 text-gray-500 hover:bg-gray-50 transition-all">
            <Filter size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Type</span>
          </button>
        </div>

        {/* Timeline View */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Full Transactional Record</p>
            <button className="text-[10px] font-black text-[#FE9800] uppercase tracking-widest flex items-center gap-2 hover:underline">
              <ExternalLink size={12} /> Export CSV
            </button>
          </div>
          
          <div className="divide-y divide-gray-50">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-24 animate-pulse bg-gray-50/20" />)
            ) : filteredLogs.map((log) => {
              const config = ACTION_ICONS[log.action] || { icon: Settings, color: 'text-gray-500', bg: 'bg-gray-50' };
              const Icon = config.icon;
              return (
                <div key={log.id} className="p-8 flex items-start gap-6 hover:bg-gray-50/50 transition-all group">
                  <div className={`w-12 h-12 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-[#1A1A1A] uppercase tracking-tighter bg-gray-100 px-2 py-0.5 rounded-md">
                          {log.admin_name}
                        </span>
                        <span className="text-[11px] font-bold text-gray-400">performed</span>
                        <span className={`text-[11px] font-black uppercase tracking-widest ${config.color}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] font-bold text-gray-400">on</span>
                        <span className="text-[11px] font-black text-[#1A1A1A] uppercase tracking-tighter">
                          {log.target_name || 'System'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
                      {log.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && filteredLogs.length === 0 && (
            <div className="py-32 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <ClipboardList size={32} />
              </div>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No activity matches your search</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
