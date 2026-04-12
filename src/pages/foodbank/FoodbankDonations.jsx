import { useState } from 'react';
import FoodbankSidebar from '../../components/foodbank/FoodbankSidebar';
import Card from '../../components/Card';
import { Gift, CheckCircle, Clock, RotateCcw } from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────
const donationsData = {
  toPickUp: [
    {
      id: 1,
      from: 'John Doe',
      to: 'Barangay Luz',
      items: 'Rice 50kg, Canned Goods 20pcs',
      proposed: 'Mar 20, 2026',
    },
    {
      id: 2,
      from: 'ABC Corporation',
      to: 'Barangay Mabolo',
      items: 'Vegetables 30kg, Cooking Oil 15L',
      proposed: 'Mar 22, 2026',
    },
    {
      id: 3,
      from: 'Maria Cruz',
      to: 'Barangay Lahug',
      items: 'Canned Goods 60pcs',
      proposed: 'Mar 23, 2026',
    },
  ],
  inProcess: [
    {
      id: 4,
      from: 'XYZ Foundation',
      to: 'Barangay Banilad',
      items: 'Mixed Goods 5 boxes',
      proposed: 'Mar 18, 2026',
      status: 'In Transit',
    },
    {
      id: 5,
      from: 'Pedro Reyes',
      to: 'Barangay Talamban',
      items: 'Rice 25kg, Instant Noodles 30pcs',
      proposed: 'Mar 17, 2026',
      status: 'Sorting',
    },
  ],
  history: [
    {
      id: 6,
      from: 'Community Helpers',
      to: 'Barangay Luz',
      items: 'Rice 100kg, Canned Goods 50pcs',
      proposed: 'Mar 10, 2026',
      completedOn: 'Mar 10, 2026',
      status: 'Completed',
    },
    {
      id: 7,
      from: 'John Doe',
      to: 'Barangay Mabolo',
      items: 'Vegetables 20kg',
      proposed: 'Mar 5, 2026',
      completedOn: 'Mar 5, 2026',
      status: 'Completed',
    },
    {
      id: 8,
      from: 'City Council',
      to: 'Barangay Lahug',
      items: 'Sugar 50kg, Cooking Oil 20L',
      proposed: 'Feb 28, 2026',
      completedOn: 'Feb 28, 2026',
      status: 'Completed',
    },
    {
      id: 9,
      from: 'Red Cross',
      to: 'Barangay Banilad',
      items: 'Emergency Relief Pack x20',
      proposed: 'Feb 20, 2026',
      completedOn: 'Feb 20, 2026',
      status: 'Completed',
    },
  ],
};

const TABS = [
  { key: 'toPickUp',  label: 'To Pick Up'  },
  { key: 'inProcess', label: 'In Process'  },
  { key: 'history',   label: 'History'     },
];

// ─── Card Components ──────────────────────────────────────────────────────────
const TagPill = ({ label, value }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>{label}:</span>
    <span className="text-xs font-medium px-2 py-0.5 bg-[#F5F5F5] rounded-md text-[#333]"
      style={{ fontFamily: 'DM Sans' }}>
      {value}
    </span>
  </div>
);

const ToPickUpCard = ({ donation, onConfirm }) => (
  <Card className="!p-5 flex flex-col gap-4">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-[#FFF3DC] flex items-center justify-center flex-shrink-0">
        <Gift size={16} className="text-[#FE9800]" />
      </div>
      <span className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
        Donation Request
      </span>
    </div>

    <div className="space-y-2">
      <TagPill label="From" value={donation.from} />
      <TagPill label="To"   value={donation.to}   />
      <div className="text-sm text-[#555]" style={{ fontFamily: 'DM Sans' }}>
        <span className="text-[#888888]">Items: </span>{donation.items}
      </div>
      <div className="text-sm text-[#888888]" style={{ fontFamily: 'DM Sans' }}>
        Proposed: {donation.proposed}
      </div>
    </div>

    <button onClick={() => onConfirm(donation.id)}
      className="w-full py-3 bg-[#FE9800] text-white font-semibold text-sm rounded-xl
        hover:bg-[#e58a00] hover:shadow-md active:scale-[0.98] transition-all"
      style={{ fontFamily: 'DM Sans' }}>
      Confirm Pickup
    </button>
  </Card>
);

const InProcessCard = ({ donation }) => (
  <Card className="!p-5 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Clock size={16} className="text-blue-500" />
        </div>
        <span className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
          In Process
        </span>
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600"
        style={{ fontFamily: 'DM Sans' }}>
        {donation.status}
      </span>
    </div>

    <div className="space-y-2">
      <TagPill label="From" value={donation.from} />
      <TagPill label="To"   value={donation.to}   />
      <div className="text-sm text-[#555]" style={{ fontFamily: 'DM Sans' }}>
        <span className="text-[#888888]">Items: </span>{donation.items}
      </div>
      <div className="text-sm text-[#888888]" style={{ fontFamily: 'DM Sans' }}>
        Proposed: {donation.proposed}
      </div>
    </div>

    {/* Progress Bar */}
    <div>
      <div className="flex justify-between text-[11px] text-[#888888] mb-1.5" style={{ fontFamily: 'DM Sans' }}>
        <span>Progress</span>
        <span>{donation.status === 'In Transit' ? '75%' : '40%'}</span>
      </div>
      <div className="w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
        <div className="h-full bg-[#FE9800] rounded-full transition-all"
          style={{ width: donation.status === 'In Transit' ? '75%' : '40%' }} />
      </div>
    </div>
  </Card>
);

const HistoryCard = ({ donation }) => (
  <Card className="!p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
          <CheckCircle size={16} className="text-green-500" />
        </div>
        <span className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
          Donation Request
        </span>
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-600"
        style={{ fontFamily: 'DM Sans' }}>
        Completed
      </span>
    </div>

    <div className="space-y-2">
      <TagPill label="From" value={donation.from} />
      <TagPill label="To"   value={donation.to}   />
      <div className="text-sm text-[#555]" style={{ fontFamily: 'DM Sans' }}>
        <span className="text-[#888888]">Items: </span>{donation.items}
      </div>
      <div className="text-sm text-[#888888]" style={{ fontFamily: 'DM Sans' }}>
        Completed: {donation.completedOn}
      </div>
    </div>
  </Card>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FoodbankDonations() {
  const [activeTab, setActiveTab]   = useState('toPickUp');
  const [donations, setDonations]   = useState(donationsData);

  const handleConfirm = (id) => {
    const confirmed = donations.toPickUp.find(d => d.id === id);
    if (!confirmed) return;
    setDonations(prev => ({
      ...prev,
      toPickUp:  prev.toPickUp.filter(d => d.id !== id),
      inProcess: [...prev.inProcess, { ...confirmed, status: 'Sorting' }],
    }));
  };

  const current = donations[activeTab];

  return (
    <div className="flex min-h-screen bg-white">
      <FoodbankSidebar />

      <div className="ml-60 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[22px] font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
            Donations
          </h1>
          <div className="flex items-center gap-2 text-sm text-[#888888]" style={{ fontFamily: 'DM Sans' }}>
            <RotateCcw size={14} />
            <span>Last updated just now</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all
                ${activeTab === key
                  ? 'bg-[#FE9800] text-white border-[#FE9800] shadow-sm'
                  : 'bg-white text-[#555] border-[#CCCCCC] hover:border-[#FE9800] hover:text-[#FE9800]'
                }`}
              style={{ fontFamily: 'DM Sans' }}>
              {label}
              {key === 'toPickUp' && donations.toPickUp.length > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full
                  ${activeTab === key ? 'bg-white text-[#FE9800]' : 'bg-[#FFF3DC] text-[#C97700]'}`}>
                  {donations.toPickUp.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        {current.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#AAAAAA]">
            <Gift size={40} className="mb-3 opacity-40" />
            <p className="text-sm" style={{ fontFamily: 'DM Sans' }}>No donations here yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {activeTab === 'toPickUp'  && donations.toPickUp.map(d  => <ToPickUpCard key={d.id} donation={d} onConfirm={handleConfirm} />)}
            {activeTab === 'inProcess' && donations.inProcess.map(d => <InProcessCard key={d.id} donation={d} />)}
            {activeTab === 'history'   && donations.history.map(d   => <HistoryCard   key={d.id} donation={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}
