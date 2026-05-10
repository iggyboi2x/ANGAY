import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Radio, CheckCircle2, Flame, Waves, ShieldAlert, MapPin, Calendar, Clock } from 'lucide-react';
import Button from '../../components/Button';

export default function AdminEmergency() {
  const [activeSignals, setActiveSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('barangays')
        .select('*')
        .eq('is_in_crisis', true);

      setActiveSignals(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();

    const channel = supabase
      .channel('emergency-monitor')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'barangays' }, () => fetchSignals())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const logAdminAction = async ({ action, targetId, targetName, details, reason, metadata }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      await supabase.from('admin_audit_logs').insert({
        admin_id: session.user.id,
        admin_name: session.user.user_metadata?.full_name || 'Admin',
        action,
        target_id: targetId,
        target_name: targetName,
        details,
        reason,
        metadata
      });
    } catch (err) {
      console.warn('Audit logging failed:', err.message);
    }
  };

  const handleResolve = async (barangayId) => {
    const sig = activeSignals.find(s => s.id === barangayId);
    setActing(barangayId);
    try {
      const { data, error } = await supabase
        .from('barangays')
        .update({
          is_in_crisis: false,
          crisis_type: null,
          crisis_started_at: null
        })
        .eq('id', barangayId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Override blocked. Please ensure you have Admin RLS permissions for the barangays table.');
      }

      await logAdminAction({
        action: 'RESOLVE_CRISIS',
        targetId: barangayId,
        targetName: sig?.barangay_name || 'Barangay',
        details: `Terminated distress signal for ${sig?.crisis_type || 'Crisis'}`,
        reason: 'Situation stabilized / Emergency services coordinated',
        metadata: { crisis_type: sig?.crisis_type, started_at: sig?.crisis_started_at }
      });

      await fetchSignals();
      alert('Crisis override successful. Distress signal terminated.');
    } catch (err) {
      console.error('Resolve Error:', err);
      alert('Failed to resolve: ' + err.message);
    } finally {
      setActing(null);
    }
  };

  return (
    <AdminLayout title="Emergency Control Center">
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Live Status Banner */}
        <div className={`p-8 rounded-[2.5rem] border flex items-center justify-between shadow-lg overflow-hidden relative ${activeSignals.length > 0
            ? 'bg-red-600 border-red-500 text-white'
            : 'bg-green-500 border-green-400 text-white'
          }`}>
          {activeSignals.length > 0 && (
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-white"
            />
          )}
          <div className="relative z-10 flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl ${activeSignals.length > 0 ? 'bg-white text-red-600' : 'bg-white text-green-500'
              }`}>
              {activeSignals.length > 0 ? <ShieldAlert size={32} /> : <CheckCircle2 size={32} />}
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                {activeSignals.length > 0
                  ? `${activeSignals.length} Active Distress Signal${activeSignals.length > 1 ? 's' : ''}`
                  : 'System Status: Nominal'}
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">
                {activeSignals.length > 0
                  ? 'Immediate response coordination required'
                  : 'All community nodes reporting safe'}
              </p>
            </div>
          </div>
          {activeSignals.length > 0 && (
            <div className="relative z-10 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md">
              <Radio size={16} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest tracking-widest">Live Monitoring Active</span>
            </div>
          )}
        </div>

        {/* Distress Signal Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {activeSignals.length === 0 ? (
              <div className="lg:col-span-2 py-32 bg-white rounded-[2.5rem] border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight">Clear Horizon</h3>
                <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto mt-2 italic">
                  No emergency signals detected across the network.
                </p>
              </div>
            ) : (
              activeSignals.map((sig) => (
                <motion.div
                  key={sig.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-[2.5rem] border border-red-100 shadow-xl shadow-red-500/5 p-8 relative overflow-hidden group"
                >
                  {/* Rippling Circle Animation */}
                  <div className="absolute top-8 right-8">
                    <div className="relative flex items-center justify-center">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            scale: [1, 2.5],
                            opacity: [0.5, 0]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.6,
                            ease: "easeOut"
                          }}
                          className="absolute w-8 h-8 rounded-full bg-red-500/20"
                        />
                      ))}
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white relative z-10 shadow-lg shadow-red-500/50">
                        <Radio size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm group-hover:scale-110 transition-transform">
                        {sig.crisis_type === 'Fire' ? <Flame size={28} /> :
                          sig.crisis_type === 'Flood' ? <Waves size={28} /> :
                            <AlertTriangle size={28} />}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight leading-none">{sig.barangay_name}</h4>
                        <p className="text-[10px] text-red-600 font-black uppercase tracking-widest mt-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                          Crisis Active: {sig.crisis_type}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-50">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Signal Started</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(sig.crisis_started_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Elapsed Time</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                          <Clock size={14} className="text-gray-400" />
                          {Math.floor((new Date() - new Date(sig.crisis_started_at)) / (1000 * 60))} mins
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          if (sig.latitude && sig.longitude) {
                            window.open(`https://www.google.com/maps?q=${sig.latitude},${sig.longitude}`, '_blank');
                          } else {
                            alert('No coordinates recorded for this barangay.');
                          }
                        }}
                        className="flex-1 h-12 bg-gray-50 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                      >
                        <MapPin size={14} /> Open Location
                      </button>
                      <button
                        onClick={() => handleResolve(sig.id)}
                        disabled={acting === sig.id}
                        className="flex-1 h-12 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                      >
                        {acting === sig.id ? 'Processing...' : 'Mark as Resolved'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
}
