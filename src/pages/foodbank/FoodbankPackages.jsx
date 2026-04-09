import { useState } from 'react';
import FoodbankSidebar from '../../components/foodbank/FoodbankSidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Package, Plus } from 'lucide-react';

const initialPackages = [
  {
    id: 1,
    name: 'Family Relief Package',
    createdAt: 'Mar 18, 2026',
    status: 'available',
    items: [
      { name: 'White Rice',    qty: 10,  unit: 'kg'    },
      { name: 'Canned Sardines', qty: 12, unit: 'cans' },
      { name: 'Cooking Oil',   qty: 2,   unit: 'liters'},
    ],
  },
  {
    id: 2,
    name: 'Emergency Food Pack',
    createdAt: 'Mar 17, 2026',
    status: 'available',
    items: [
      { name: 'Instant Noodles', qty: 24, unit: 'packs' },
      { name: 'Canned Tuna',     qty: 8,  unit: 'cans'  },
      { name: 'Sugar',           qty: 5,  unit: 'kg'    },
    ],
  },
  {
    id: 3,
    name: 'Weekly Sustenance Package',
    createdAt: 'Mar 16, 2026',
    status: 'available',
    items: [
      { name: 'White Rice',      qty: 15, unit: 'kg'    },
      { name: 'Canned Sardines', qty: 10, unit: 'cans'  },
      { name: 'Instant Noodles', qty: 20, unit: 'packs' },
      { name: 'Cooking Oil',     qty: 3,  unit: 'liters'},
    ],
  },
  {
    id: 4,
    name: 'Community Distribution Pack',
    createdAt: 'Mar 10, 2026',
    status: 'donated',
    items: [
      { name: 'White Rice',      qty: 25, unit: 'kg'   },
      { name: 'Canned Goods Mix',qty: 30, unit: 'cans' },
    ],
  },
];

const StatusBadge = ({ status }) => (
  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
    status === 'available'
      ? 'bg-green-50 text-green-600'
      : 'bg-[#F0F0F0] text-[#888888]'
  }`} style={{ fontFamily: 'DM Sans' }}>
    {status === 'available' ? 'Available' : 'Donated'}
  </span>
);

export default function FoodbankPackages() {
  const [packages, setPackages] = useState(initialPackages);

  const availableCount = packages.filter(p => p.status === 'available').length;

  const handleDonate = (id) => {
    setPackages(packages.map(p => p.id === id ? { ...p, status: 'donated' } : p));
  };

  return (
    <div className="flex min-h-screen bg-white">
      <FoodbankSidebar />

      <div className="ml-60 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <h1 className="text-[22px] font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
            Donation Packages
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-100"
              style={{ fontFamily: 'DM Sans' }}>
              {availableCount} Available Packages
            </span>
            <Button variant="primary" icon={<Plus size={16} />}>
              New Package
            </Button>
          </div>
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-2 gap-5">
          {packages.map((pkg) => {
            const isDonated = pkg.status === 'donated';
            return (
              <Card key={pkg.id} className={`!p-5 flex flex-col gap-4 ${isDonated ? 'opacity-70' : ''}`}>
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF3DC] flex items-center justify-center flex-shrink-0">
                      <Package size={20} className="text-[#FE9800]" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
                        {pkg.name}
                      </div>
                      <div className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>
                        Created: {pkg.createdAt}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={pkg.status} />
                </div>

                {/* Package Contents */}
                <div className="bg-[#F5F5F5] rounded-xl p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#888888] mb-3"
                    style={{ fontFamily: 'DM Sans' }}>
                    Package Contents ({pkg.items.length} items)
                  </div>
                  <div className="space-y-2">
                    {pkg.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-[#333]" style={{ fontFamily: 'DM Sans' }}>
                          {item.name}
                        </span>
                        <span className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
                          {item.qty} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => !isDonated && handleDonate(pkg.id)}
                  disabled={isDonated}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all
                    ${isDonated
                      ? 'bg-[#FDE9B8] text-[#C97700] cursor-not-allowed'
                      : 'bg-[#FE9800] text-white hover:bg-[#e58a00] hover:shadow-md active:scale-[0.98]'
                    }`}
                  style={{ fontFamily: 'DM Sans' }}>
                  {isDonated ? 'Already Donated' : 'Donate Package'}
                </button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
