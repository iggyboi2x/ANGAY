import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import Modal from './Modal';
import Button from './Button';
import { Search, AlertTriangle, Image as ImageIcon, X, CheckCircle2, User, Building2, MapPin } from 'lucide-react';

const PREDEFINED_REASONS = [
  'Inappropriate Behavior',
  'Spam or Misleading',
  'Fraud or Scam',
  'Offensive Content',
  'Safety Concerns',
  'Other'
];

export default function ReportModal({ isOpen, onClose }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [proof, setProof] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searching, setSearching] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        // Fetch from all three tables
        const [fbRes, brgyRes, donorRes] = await Promise.all([
          supabase.from('foodbanks').select('id, org_name, logo_url').ilike('org_name', `%${search}%`).limit(5),
          supabase.from('barangays').select('id, barangay_name, barangay_profile').ilike('barangay_name', `%${search}%`).limit(5),
          supabase.from('profiles').select('id, full_name').ilike('full_name', `%${search}%`).limit(5)
        ]);

        const combined = [
          ...(fbRes.data || []).map(r => ({ id: r.id, name: r.org_name, avatar: r.logo_url, type: 'foodbank' })),
          ...(brgyRes.data || []).map(r => ({ id: r.id, name: r.barangay_name, avatar: r.barangay_profile, type: 'barangay' })),
          ...(donorRes.data || []).map(r => ({ id: r.id, name: r.full_name, type: 'donor' }))
        ];

        setResults(combined);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProof(file);
      const reader = new FileReader();
      reader.onloadend = () => setProofPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAccount || !reason) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      let proofUrl = null;

      if (proof) {
        const fileExt = proof.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('proofs')
          .upload(filePath, proof);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('proofs')
            .getPublicUrl(filePath);
          proofUrl = publicUrl;
        }
      }

      const finalReason = reason === 'Other' ? customReason : reason;

      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_id: selectedAccount.id,
        reported_type: selectedAccount.type,
        reason: finalReason,
        proof_url: proofUrl,
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSearch('');
    setSelectedAccount(null);
    setReason('');
    setCustomReason('');
    setProof(null);
    setProofPreview(null);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <Modal isOpen={isOpen} onClose={() => { onClose(); reset(); }} title="Report Submitted" width="sm">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-tight">Thank You</h3>
          <p className="text-sm text-gray-500 mb-6 px-4">
            We have received your report. Our safety team will investigate this matter within 24-48 hours.
          </p>
          <Button variant="primary" onClick={() => { onClose(); reset(); }} className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Account" width="md">
      <div className="space-y-6">
        {/* Step 1: Select Account */}
        {!selectedAccount ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search account to report..."
                className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#FE9800] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {searching && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-[#FE9800] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {results.length > 0 && (
              <div className="max-h-[300px] overflow-y-auto rounded-2xl border border-gray-50 divide-y divide-gray-50 shadow-sm bg-white">
                {results.map((acc) => (
                  <button
                    key={`${acc.type}-${acc.id}`}
                    onClick={() => setSelectedAccount(acc)}
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-orange-50/50 transition-all text-left group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      acc.type === 'foodbank' ? 'bg-orange-50 text-orange-600' :
                      acc.type === 'barangay' ? 'bg-blue-50 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {acc.avatar ? (
                        <img src={acc.avatar} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        acc.type === 'foodbank' ? <Building2 size={18} /> :
                        acc.type === 'barangay' ? <MapPin size={18} /> :
                        <User size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate uppercase tracking-tight group-hover:text-[#FE9800] transition-colors">{acc.name}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{acc.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!searching && search.trim() && results.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 font-medium">No accounts found matching "{search}"</p>
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Form */
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-[2rem] border border-gray-100">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                selectedAccount.type === 'foodbank' ? 'bg-orange-50 text-orange-600' :
                selectedAccount.type === 'barangay' ? 'bg-blue-50 text-blue-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {selectedAccount.avatar ? (
                  <img src={selectedAccount.avatar} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  selectedAccount.type === 'foodbank' ? <Building2 size={24} /> :
                  selectedAccount.type === 'barangay' ? <MapPin size={24} /> :
                  <User size={24} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">Reporting: {selectedAccount.name}</p>
                <button 
                  onClick={() => setSelectedAccount(null)}
                  className="text-[10px] font-black text-[#FE9800] uppercase tracking-widest hover:underline"
                >
                  Change Account
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Reason for Report</p>
              <div className="grid grid-cols-2 gap-2">
                {PREDEFINED_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      reason === r 
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' 
                        : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {reason === 'Other' && (
              <textarea
                placeholder="Describe the issue in detail..."
                className="w-full h-32 p-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#FE9800] transition-all resize-none"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}

            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Proof (Optional)</p>
              <div 
                onClick={() => fileInputRef.current.click()}
                className="w-full h-32 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#FE9800] hover:bg-orange-50/20 transition-all overflow-hidden relative group"
              >
                {proofPreview ? (
                  <>
                    <img src={proofPreview} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Change Image</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-[#FE9800] group-hover:scale-110 transition-all">
                      <ImageIcon size={20} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload Image Evidence</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="ghost" 
                onClick={onClose} 
                className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={loading || !reason || (reason === 'Other' && !customReason.trim())}
                className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-100"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
