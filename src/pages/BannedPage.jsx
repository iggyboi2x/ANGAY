import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Ban, Send, LogOut, ShieldAlert, MessageCircle, Clock } from 'lucide-react';

export default function BannedPage() {
  const [profile, setProfile] = useState(null);
  const [appeal, setAppeal] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login';
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('is_banned, ban_reason, banned_until')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching ban status:', error);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  const handleAppeal = async (e) => {
    e.preventDefault();
    if (!appeal.trim()) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('ban_appeals')
        .insert({
          user_id: user.id,
          message: appeal
        });

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-sm text-gray-500 font-black uppercase tracking-widest animate-pulse">Scanning Platform Status...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-8">
        
        {/* Header Alert */}
        <div className="bg-white rounded-[3rem] border-4 border-red-500 p-10 shadow-2xl shadow-red-500/10 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          
          <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-red-500 animate-bounce">
            <Ban size={48} />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black text-[#1A1A1A] uppercase tracking-tighter leading-none">
              Account Restricted
            </h1>
            <p className="text-gray-400 text-sm font-medium">Your platform access has been suspended by an administrator.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-10 text-left">
            <div className="p-6 bg-red-50/50 rounded-[2rem] border border-red-100">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <ShieldAlert size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Reason</span>
              </div>
              <p className="text-sm text-red-900 font-bold leading-relaxed">
                {profile?.ban_reason || 'No specific reason provided.'}
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Clock size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Duration</span>
              </div>
              <p className="text-sm text-gray-900 font-black">
                Until {profile?.banned_until ? new Date(profile.banned_until).toLocaleDateString() : 'Permanent'}
              </p>
            </div>
          </div>
        </div>

        {/* Appeal Section */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-[#FE9800]">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight">Submit an Appeal</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">If you believe this is a mistake, explain why.</p>
            </div>
          </div>

          {!submitted ? (
            <form onSubmit={handleAppeal} className="space-y-4">
              <textarea
                className="w-full h-32 p-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-[#FE9800] transition-all resize-none"
                placeholder="Type your appeal message here..."
                value={appeal}
                onChange={(e) => setAppeal(e.target.value)}
                required
              />
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-8 h-14 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
                <button
                  disabled={sending}
                  className="flex-1 h-14 bg-[#1A1A1A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10"
                >
                  {sending ? 'Sending...' : (
                    <>
                      <Send size={16} /> Send Appeal
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-8 text-center animate-in zoom-in duration-500">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={24} />
              </div>
              <h4 className="text-lg font-black text-[#1A1A1A] uppercase">Appeal Submitted</h4>
              <p className="text-xs text-gray-400 mt-2 font-medium">An administrator will review your message soon.</p>
              <button
                onClick={handleLogout}
                className="mt-6 px-10 h-12 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Logout Now
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">
          ANGAY Community Safety System &bull; Platform Integrity
        </p>
      </div>
    </div>
  );
}
