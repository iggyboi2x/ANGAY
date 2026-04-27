import { useState, useEffect } from 'react';
import FoodbankSidebar from '../../components/foodbank/FoodbankSidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Package, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../supabase';
import { useProfile } from '../../hooks/useProfile';
import SendFoodAidModal from '../../components/foodbank/SendFoodAidModal';
import FlashMessage from '../../components/FlashMessage';

const StatusBadge = ({ status }) => {
  const styles = {
    available: 'bg-green-50 text-green-600 border border-green-100',
    pending: 'bg-blue-50 text-blue-600 border border-blue-100',
    donated: 'bg-[#F0F0F0] text-[#888888] border border-[#E0E0E0]'
  };
  const labels = { available: 'Available', pending: 'Pending', donated: 'Donated' };
  const icons = { 
    available: <Clock size={12} />, 
    pending: <Clock size={12} className="animate-pulse" />, 
    donated: <CheckCircle2 size={12} /> 
  };

  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${styles[status] || styles.donated}`} style={{ fontFamily: 'DM Sans' }}>
      {icons[status] || icons.donated}
      {labels[status] || labels.donated}
    </span>
  );
};

const TABS = [
  { key: 'available', label: 'Available' },
  { key: 'pending',   label: 'Pending Confirmation' },
  { key: 'donated',   label: 'Donated' },
];

export default function FoodbankPackages() {
  const { id: foodbankId, displayName } = useProfile();
  const [packages, setPackages] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState(null);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (foodbankId) {
      fetchPackages();
      fetchBarangays();
    }
  }, [foodbankId]);

  const fetchBarangays = async () => {
    const { data } = await supabase.from('barangays').select('id, barangay_name').not('latitude', 'is', null);
    setBarangays(data || []);
  };

  const fetchPackages = async () => {
    setLoading(true);
    // Fetch packages with items and their associated distributions (to get barangay name)
    const { data, error } = await supabase
      .from('donation_packages')
      .select('*, package_items(*), distributions(barangay_name)')
      .eq('foodbank_id', foodbankId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching packages:', error);
    } else {
      // Map distributions to the package for easier access
      const formatted = (data || []).map(p => ({
        ...p,
        barangay_name: p.distributions?.[0]?.barangay_name || null
      }));
      setPackages(formatted);
    }
    setLoading(false);
  };

  const handleSend = async (form) => {
    const bay = barangays.find(b => b.id === form.barangay_id);
    const { error: distError } = await supabase.from('distributions').insert({
      foodbank_id:   foodbankId,
      barangay_id:   form.barangay_id,
      foodbank_name: displayName,
      barangay_name: bay?.barangay_name || '',
      items:         form.items,
      notes:         form.notes || null,
      scheduled_date: form.scheduled_date,
      status:        'pending',
      package_id:    form.package_id || null,
    });

    if (distError) {
      console.error(distError);
      return { error: distError.message };
    }

    if (form.package_id) {
      const { error: pkgError } = await supabase.from('donation_packages')
        .update({ status: 'pending' })
        .eq('id', form.package_id);
      
      if (pkgError) {
        console.error(pkgError);
        return { error: pkgError.message };
      }
    }

    setFlash({ type: 'success', message: 'Food aid distribution sent successfully!' });
    setShowSendModal(false);
    fetchPackages();
    return { success: true };
  };

  const counts = {
    available: packages.filter(p => p.status === 'available').length,
    pending:   packages.filter(p => p.status === 'pending').length,
    donated:   packages.filter(p => p.status === 'donated').length,
  };

  const filtered = packages.filter(p => p.status === activeTab);

  return (
    <div className="flex min-h-screen bg-white">
      <FoodbankSidebar />

      <div className="ml-60 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-[24px] font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
              Donation Packages
            </h1>
            <p className="text-sm text-[#888888] mt-1" style={{ fontFamily: 'DM Sans' }}>
              Manage your prepared relief goods and track their distribution status.
            </p>
          </div>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => window.location.href='/foodbank/inventory'}>
            New Package
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-[#F5F5F5] p-1.5 rounded-[18px] w-fit">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-6 py-2.5 rounded-[14px] text-sm font-bold transition-all duration-300 flex items-center gap-2
                ${activeTab === key
                  ? 'bg-white text-[#FE9800] shadow-[0px_4px_12px_rgba(0,0,0,0.05)] scale-[1.02]'
                  : 'text-[#888888] hover:text-[#555] hover:bg-gray-100'
                }`}
              style={{ fontFamily: 'DM Sans' }}
            >
              {label}
              {counts[key] > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === key ? 'bg-[#FE9800] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Package Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading packages...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 bg-[#F9FAFB]/50 rounded-[32px] border-2 border-dashed border-[#E0E0E0]">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
              <Package size={30} className="text-[#CCC]" />
            </div>
            <p className="text-base text-[#888] font-bold" style={{ fontFamily: 'DM Sans' }}>No {activeTab} packages found.</p>
            <p className="text-sm text-[#AAA] mt-1 max-w-[280px] text-center" style={{ fontFamily: 'DM Sans' }}>
              {activeTab === 'available' 
                ? "Go to Inventory to pack your first relief package for distribution." 
                : activeTab === 'pending'
                ? "Packages currently being sent to barangays will appear here."
                : "Your distribution history will appear here once packages are received."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filtered.map((pkg) => (
              <PackageCard 
                key={pkg.id} 
                pkg={pkg} 
                onSend={() => {
                  setSelectedPkgId(pkg.id);
                  setShowSendModal(true);
                }} 
              />
            ))}
          </div>
        )}
      </div>

      {showSendModal && (
        <SendFoodAidModal
          barangays={barangays}
          packages={packages}
          initialPackageId={selectedPkgId}
          onClose={() => setShowSendModal(false)}
          onSubmit={handleSend}
        />
      )}

      {flash && (
        <FlashMessage
          type={flash.type}
          message={flash.message}
          onClose={() => setFlash(null)}
        />
      )}
    </div>
  );
}
function PackageCard({ pkg, onSend }) {
  const isDonated = pkg.status === 'donated';
  const isPending = pkg.status === 'pending';
  return (
    <Card className={`!p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-lg ${(isDonated || isPending) ? 'opacity-80' : ''}`}>
      {/* Card Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${isDonated ? 'bg-gray-100' : isPending ? 'bg-blue-50' : 'bg-[#FFF3DC]'}`}>
            <Package size={24} className={isDonated ? 'text-gray-400' : isPending ? 'text-blue-500' : 'text-[#FE9800]'} />
          </div>
          <div>
            <div className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
              {pkg.name}
            </div>
            {isPending && pkg.barangay_name && (
              <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mt-0.5" style={{ fontFamily: 'DM Sans' }}>
                Sent to: {pkg.barangay_name}
              </div>
            )}
            <div className="text-xs text-[#888888] mt-0.5" style={{ fontFamily: 'DM Sans' }}>
              Created: {new Date(pkg.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
        <StatusBadge status={pkg.status} />
      </div>

      {/* Package Contents */}
      <div className={`rounded-2xl p-5 border transition-colors ${isDonated ? 'bg-gray-50 border-gray-100' : isPending ? 'bg-blue-50/30 border-blue-100' : 'bg-[#F9FAFB] border-[#F0F0F0]'}`}>
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#AAAAAA] mb-4 flex justify-between"
          style={{ fontFamily: 'DM Sans' }}>
          <span>Package Contents</span>
          <span>{pkg.package_items?.length || 0} items</span>
        </div>
        <div className="space-y-3">
          {pkg.package_items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-[#444]" style={{ fontFamily: 'DM Sans' }}>
                {item.item_name}
              </span>
              <span className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
                {item.quantity} {item.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => !(isDonated || isPending) && onSend && onSend()}
        disabled={isDonated || isPending}
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200
          ${isDonated
            ? 'bg-[#E0E0E0] text-[#888888] cursor-not-allowed'
            : isPending
            ? 'bg-blue-100 text-blue-500 cursor-not-allowed'
            : 'bg-[#FE9800] text-white hover:bg-[#e58a00] hover:shadow-md active:scale-[0.98]'
          }`}
        style={{ fontFamily: 'DM Sans' }}>
        {isDonated ? 'Distributed' : isPending ? 'Sent (Pending Receipt)' : 'Send to Barangay'}
      </button>
    </Card>
  );
}
