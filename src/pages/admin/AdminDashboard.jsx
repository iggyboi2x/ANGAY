import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import {
  TrendingUp, Users, Package, AlertCircle, ArrowUpRight,
  ArrowDownRight, Building2, MapPin, ShieldCheck, Ban,
  User, Truck, CheckCircle2, History, ChevronRight
} from 'lucide-react';
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
        pendingReportsFetch,
        donationsFetch
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'donor'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'foodbank'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'barangay'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).or('status.eq.pending,status.is.null'),
        supabase.from('donations').select('id', { count: 'exact', head: true })
      ]);

      setBreakdown({
        donors: donors.count || 0,
        foodbanks: foodbanks.count || 0,
        barangays: barangays.count || 0,
        admins: admins.count || 0
      });

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
          value: (donationsFetch.count || 0).toString(),
          change: null,
          icon: Package,
          color: 'green'
        },
      ]);

      const { data: ledger } = await supabase
        .from('global_activity_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity(ledger?.map(entry => {
        const statusMap = {
          DONOR_PROPOSE: 'Proposed',
          FOODBANK_ACCEPT: 'Accepted',
          FOODBANK_PROPOSE: 'Dispatched',
          BARANGAY_ACCEPT: 'Received',
          BARANGAY_DISTRIBUTE: 'Distributed',
          EMERGENCY_SOS: 'Emergency'
        };

        return {
          id: entry.id.split('-')[0].slice(0, 8).toUpperCase(),
          actor_name: entry.actor_name,
          actor_role: entry.actor_role,
          target_name: entry.target_name || 'System',
          status: statusMap[entry.action_type] || 'Activity',
          desc: entry.details,
          time: new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action_type: entry.action_type
        };
      }) || []);

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
                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${stat.color === 'orange' ? 'bg-orange-50 text-orange-500' :
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
                    <div className={`flex items-center justify-end gap-1 text-[8px] font-black uppercase tracking-widest mt-1.5 ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
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
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm relative ${activity.action_type === 'DONOR_PROPOSE' ? 'bg-blue-50 text-blue-500' :
                        activity.action_type === 'FOODBANK_ACCEPT' ? 'bg-green-50 text-green-500' :
                          activity.action_type === 'FOODBANK_PROPOSE' ? 'bg-orange-50 text-orange-500' :
                            activity.action_type === 'BARANGAY_ACCEPT' ? 'bg-purple-50 text-purple-500' :
                              activity.action_type === 'BARANGAY_DISTRIBUTE' ? 'bg-emerald-50 text-emerald-600' :
                                activity.action_type === 'EMERGENCY_SOS' ? 'bg-red-50 text-red-600' :
                                  'bg-gray-50 text-gray-500'
                      }`}>
                      {activity.action_type === 'DONOR_PROPOSE' && <Package size={20} />}
                      {activity.action_type === 'FOODBANK_ACCEPT' && <ShieldCheck size={20} />}
                      {activity.action_type === 'FOODBANK_PROPOSE' && <Truck size={20} />}
                      {activity.action_type === 'BARANGAY_ACCEPT' && <Building2 size={20} />}
                      {activity.action_type === 'BARANGAY_DISTRIBUTE' && <CheckCircle2 size={20} />}
                      {activity.action_type === 'EMERGENCY_SOS' && <AlertCircle size={20} />}
                      {!['DONOR_PROPOSE', 'FOODBANK_ACCEPT', 'FOODBANK_PROPOSE', 'BARANGAY_ACCEPT', 'BARANGAY_DISTRIBUTE', 'EMERGENCY_SOS'].includes(activity.action_type) && <History size={20} />}

                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[7px] font-black shadow-sm uppercase text-[#1A1A1A]">
                        {activity.actor_role[0]}
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
                        <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-tighter bg-gray-100 px-2 py-0.5 rounded-md">
                          {activity.actor_name}
                        </span>

                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">performed</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${activity.action_type === 'DONOR_PROPOSE' ? 'text-blue-600' :
                            activity.action_type === 'FOODBANK_ACCEPT' ? 'text-green-600' :
                              activity.action_type === 'FOODBANK_PROPOSE' ? 'text-orange-600' :
                                activity.action_type === 'BARANGAY_ACCEPT' ? 'text-purple-600' :
                                  activity.action_type === 'BARANGAY_DISTRIBUTE' ? 'text-emerald-600' :
                                    activity.action_type === 'EMERGENCY_SOS' ? 'text-red-600' :
                                      'text-gray-600'
                          }`}>
                          {activity.status}
                        </span>

                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">to</span>
                        <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-tighter bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                          {activity.target_name}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 font-medium line-clamp-1 max-w-xl">
                        {activity.desc}
                      </p>
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

            {recentActivity.length > 0 && (
              <div className="p-8 bg-gray-50/50 flex justify-center">
                <Link
                  to="/admin/logistics"
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#FE9800] hover:border-[#FE9800] hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                >
                  See Full Global Ledger
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}

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
