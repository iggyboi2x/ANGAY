import { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  PointElement, 
  LineElement, 
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import AdminLayout from '../../components/admin/AdminLayout';
import { TrendingUp, Users, Package, AlertCircle, ArrowUpRight, ArrowDownRight, Building2, MapPin, ShieldCheck, Ban, User } from 'lucide-react';
import { supabase } from '../../../supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Total Active Users', value: '0', change: null, icon: Users, color: 'blue' },
    { label: 'Pending Tasks', value: '0', change: null, icon: AlertCircle, color: 'red' },
    { label: 'Total Units Moved', value: '0', change: null, icon: Package, color: 'green' },
  ]);

  const [recentActivity, setRecentActivity] = useState([]);

  const [breakdown, setBreakdown] = useState({ donors: 0, foodbanks: 0, barangays: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        totalProfiles,
        verifiedProfiles,
        bannedProfiles,
        donors,
        foodbanks,
        barangays,
        admins,
        pendingReportsFetch
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'donor'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'foodbank'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'barangay'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).or('status.eq.pending,status.is.null')
      ]);

      setBreakdown({
        donors: donors.count || 0,
        foodbanks: foodbanks.count || 0,
        barangays: barangays.count || 0,
        admins: admins.count || 0
      });

      const { data: donations } = await supabase
        .from('donations')
        .select('id, items, status, created_at')
        .order('created_at', { ascending: false });

      const totalItems = donations?.length || 0;

      setStats([
        { 
          label: 'Total Active Users', 
          value: (totalProfiles.count || 0).toLocaleString(), 
          change: null, 
          icon: Users, 
          color: 'blue',
          breakdown: true 
        },
        { 
          label: 'Verified Partners', 
          value: (verifiedProfiles.count || 0).toLocaleString(), 
          change: null, 
          icon: ShieldCheck, 
          color: 'orange' 
        },
        { 
          label: 'Pending Tasks', 
          value: (pendingReportsFetch.count || 0).toString(), 
          change: null, 
          icon: AlertCircle, 
          color: 'red' 
        },
        { 
          label: 'Restricted Node', 
          value: (bannedProfiles.count || 0).toString(), 
          change: null, 
          icon: Ban, 
          color: 'red' 
        },
        { 
          label: 'Global Flow', 
          value: totalItems.toString(), 
          change: null, 
          icon: Package, 
          color: 'green' 
        },
      ]);

      setRecentActivity(donations?.slice(0, 10).map(d => ({
        id: `TX-${d.id.slice(0,4)}`,
        item: d.items || 'Mixed Supplies',
        target: 'System Record',
        status: (d.status || 'pending').charAt(0).toUpperCase() + (d.status || 'pending').slice(1),
        desc: d.status === 'pending' || d.status === 'reviewing' ? 'Donor has submitted request; Food Bank review pending.' :
              d.status === 'accepted' || d.status === 'in-progress' ? 'Food Bank has accepted and is preparing for dispatch.' :
              d.status === 'in-transit' ? 'Goods are on the way to the destination.' :
              'Goods have been successfully received and distributed.',
        time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })) || []);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AdminLayout title="System Intelligence">
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between min-h-[140px]">
              <div className="flex items-start justify-between gap-4">
                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${
                  stat.color === 'orange' ? 'bg-orange-50 text-orange-500' :
                  stat.color === 'blue' ? 'bg-blue-50 text-blue-500' :
                  stat.color === 'red' ? 'bg-red-50 text-red-500' :
                  'bg-green-50 text-green-500'
                } group-hover:scale-105 transition-transform`}>
                  <stat.icon size={20} />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                  <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tighter leading-none">{loading ? '...' : stat.value}</h3>
                  {stat.change && (
                    <div className={`flex items-center justify-end gap-1 text-[8px] font-black uppercase tracking-widest mt-1.5 ${
                      stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {stat.change}
                    </div>
                  )}
                </div>
              </div>

              {stat.breakdown && (
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-blue-500" />
                    </div>
                    <span className="text-[8px] font-black text-gray-400 uppercase">{breakdown.donors}D</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-orange-500" />
                    </div>
                    <span className="text-[8px] font-black text-gray-400 uppercase">{breakdown.foodbanks}B</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-green-500" />
                    </div>
                    <span className="text-[8px] font-black text-gray-400 uppercase">{breakdown.barangays}G</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-purple-500" />
                    </div>
                    <span className="text-[8px] font-black text-gray-400 uppercase">{breakdown.admins}A</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Live Activity Feed */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <div>
              <h3 className="text-base font-black text-[#1A1A1A] uppercase tracking-tight">Live Activity Feed</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time Lifecycle: Donor → Food Bank → Barangay → Beneficiary</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#FE9800]">
              <span className="w-2 h-2 bg-[#FE9800] rounded-full animate-ping" />
              Live Stream
            </div>
          </div>
          
          <div className="divide-y divide-gray-50">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="p-8 hover:bg-gray-50/50 transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-6 flex-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      activity.status === 'Pending' || activity.status === 'Reviewing' ? 'bg-amber-50 text-amber-500' :
                      activity.status === 'Accepted' || activity.status === 'In-progress' ? 'bg-blue-50 text-blue-500' :
                      activity.status === 'In-transit' ? 'bg-purple-50 text-purple-500' :
                      'bg-green-50 text-green-500'
                    }`}>
                      <Package size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          activity.status === 'Pending' || activity.status === 'Reviewing' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          activity.status === 'Accepted' || activity.status === 'In-progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          activity.status === 'In-transit' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                          'bg-green-50 text-green-600 border-green-100'
                        }`}>
                          {activity.status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{activity.id}</span>
                      </div>
                      <h4 className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight">{activity.item}</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-xl">{activity.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 pl-18 lg:pl-0">
                    <div className="hidden sm:flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                          <Users size={14} />
                        </div>
                        <div className="w-4 h-px bg-gray-200" />
                        <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">
                          <Building2 size={14} />
                        </div>
                        <div className="w-4 h-px bg-gray-200" />
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                          <MapPin size={14} />
                        </div>
                      </div>
                      <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">Lifecycle Trace</p>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <p className="text-xs font-black text-[#1A1A1A] uppercase tracking-tighter">{activity.time}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!loading && recentActivity.length === 0 && (
              <div className="py-20 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                No recent activity recorded
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
