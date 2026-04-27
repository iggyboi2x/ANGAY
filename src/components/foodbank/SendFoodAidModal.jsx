import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

const inputCls = "w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/20 transition-all";

export default function SendFoodAidModal({ barangays, packages = [], onClose, onSubmit, initialPackageId = '' }) {
  const [form, setForm] = useState({ 
    barangay_id: '', 
    items: initialPackageId ? packages.find(p => p.id === initialPackageId)?.package_items?.map(i => `${i.item_name} (${i.quantity} ${i.unit})`).join(', ') || '' : '', 
    notes: '', 
    scheduled_date: '', 
    package_id: initialPackageId 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = k => e => {
    const val = e.target.value;
    if (k === 'package_id' && val) {
      const pkg = packages.find(p => p.id === val);
      const pkgItems = pkg?.package_items?.map(i => `${i.item_name} (${i.quantity} ${i.unit})`).join(', ') || '';
      setForm(f => ({ ...f, [k]: val, items: pkgItems }));
    } else {
      setForm(f => ({ ...f, [k]: val }));
    }
  };

  const submit = async () => {
    if (!form.barangay_id || !form.items || !form.scheduled_date) {
      setError('Please fill in all required fields.'); return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await onSubmit(form);
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        // Success handled by parent (e.g. closing modal)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FE9800] to-[#FBBF24]" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Send Food Aid to Barangay</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" style={{ fontFamily: 'DM Sans' }}>Barangay *</label>
              <div className="relative">
                <select value={form.barangay_id} onChange={set('barangay_id')} className={inputCls + ' appearance-none pr-8'} style={{ fontFamily: 'DM Sans' }}>
                  <option value="">Select barangay…</option>
                  {barangays.map(b => <option key={b.id} value={b.id}>{b.barangay_name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" style={{ fontFamily: 'DM Sans' }}>Select Package <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
              <div className="relative">
                <select value={form.package_id} onChange={set('package_id')} className={inputCls + ' appearance-none pr-8'} style={{ fontFamily: 'DM Sans' }}>
                  <option value="">Choose a prepared package…</option>
                  {packages.filter(p => p.status === 'available').map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.package_items?.length || 0} items)</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" style={{ fontFamily: 'DM Sans' }}>Items {form.package_id ? <span className="text-[#FE9800]">(Selected from Package)</span> : '*'}</label>
              <textarea value={form.items} onChange={set('items')} rows={3}
                placeholder="e.g. Rice 50kg, Canned goods 20pcs"
                className={inputCls + ' resize-none'} style={{ fontFamily: 'DM Sans' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" style={{ fontFamily: 'DM Sans' }}>Scheduled Date *</label>
              <input type="date" value={form.scheduled_date} onChange={set('scheduled_date')}
                min={new Date().toISOString().split('T')[0]} className={inputCls} style={{ fontFamily: 'DM Sans' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" style={{ fontFamily: 'DM Sans' }}>Notes <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
              <textarea value={form.notes} onChange={set('notes')} rows={2}
                placeholder="Any special instructions…" className={inputCls + ' resize-none'} style={{ fontFamily: 'DM Sans' }} />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors" style={{ fontFamily: 'DM Sans' }}>Cancel</button>
            <button onClick={submit} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#FE9800] text-white text-sm font-semibold hover:bg-[#e58a00] disabled:opacity-60 transition-all" style={{ fontFamily: 'DM Sans' }}>
              {loading ? 'Sending…' : 'Send Food Aid'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
