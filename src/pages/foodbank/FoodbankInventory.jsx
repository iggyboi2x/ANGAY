import { useState } from 'react';
import FoodbankSidebar from '../../components/foodbank/FoodbankSidebar';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import {
  Package, AlertTriangle, CloudUpload, Search,
  Box, Upload, Plus, Pencil, Trash2, Minus
} from 'lucide-react';

const initialItems = [
  { id: '1', name: 'White Rice',      category: 'Grains',       quantity: 250, unit: 'kg',    expiryDate: '2027-01-15', status: 'fresh'    },
  { id: '2', name: 'Canned Sardines', category: 'Canned Goods', quantity: 180, unit: 'cans',  expiryDate: '2026-04-20', status: 'expiring' },
  { id: '3', name: 'Cooking Oil',     category: 'Pantry',       quantity: 45,  unit: 'liters',expiryDate: '2026-12-30', status: 'fresh'    },
  { id: '4', name: 'Instant Noodles', category: 'Instant Food', quantity: 320, unit: 'packs', expiryDate: '2026-05-10', status: 'expiring' },
  { id: '5', name: 'Canned Tuna',     category: 'Canned Goods', quantity: 95,  unit: 'cans',  expiryDate: '2026-08-25', status: 'fresh'    },
  { id: '6', name: 'Sugar',           category: 'Pantry',       quantity: 120, unit: 'kg',    expiryDate: '2026-03-30', status: 'expiring' },
];

export default function FoodbankInventory() {
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus]     = useState('all');
  const [showPackModal, setShowPackModal]       = useState(false);
  const [packageItems, setPackageItems]         = useState([]);
  const [packageName, setPackageName]           = useState('');

  const inventoryItems = initialItems;
  const expiringItems  = inventoryItems.filter(i => i.status === 'expiring');
  const categories     = ['all', ...new Set(inventoryItems.map(i => i.category))];

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch   = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus   = selectedStatus   === 'all' || item.status   === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddToPackage = (item) => {
    const existing = packageItems.find(pi => pi.item.id === item.id);
    if (existing) {
      setPackageItems(packageItems.map(pi =>
        pi.item.id === item.id ? { ...pi, quantity: Math.min(pi.quantity + 1, item.quantity) } : pi
      ));
    } else {
      setPackageItems([...packageItems, { item, quantity: 1 }]);
    }
  };

  const handleRemoveFromPackage = (itemId) =>
    setPackageItems(packageItems.filter(pi => pi.item.id !== itemId));

  const handleQuantityChange = (itemId, newQty) =>
    setPackageItems(packageItems.map(pi =>
      pi.item.id === itemId
        ? { ...pi, quantity: Math.max(1, Math.min(newQty, pi.item.quantity)) }
        : pi
    ));

  const handleSavePackage = () => {
    if (packageItems.length > 0 && packageName.trim()) {
      alert(`Donation package "${packageName}" saved successfully!`);
      setShowPackModal(false);
      setPackageItems([]);
      setPackageName('');
    }
  };

  const closeModal = () => { setShowPackModal(false); setPackageItems([]); setPackageName(''); };

  return (
    <div className="flex min-h-screen bg-white">
      <FoodbankSidebar />

      <div className="ml-60 flex-1">
        <div className="p-8">

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <Card className="!p-4">
              <div className="flex items-center gap-3">
                <Package size={20} className="text-[#FE9800]" />
                <div>
                  <div className="text-2xl font-bold" style={{ fontFamily: 'DM Sans' }}>{inventoryItems.length}</div>
                  <div className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>Total SKUs</div>
                </div>
              </div>
            </Card>
            <Card className="!p-4">
              <div className="flex items-center gap-3">
                <Package size={20} className="text-[#FE9800]" />
                <div>
                  <div className="text-2xl font-bold" style={{ fontFamily: 'DM Sans' }}>
                    {inventoryItems.reduce((s, i) => s + i.quantity, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>Total Items</div>
                </div>
              </div>
            </Card>
            <Card className="!p-4" style={{ backgroundColor: '#FFF3DC', borderColor: '#FE9800' }}>
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-[#C97700]" />
                <div>
                  <div className="text-2xl font-bold" style={{ fontFamily: 'DM Sans', color: '#C97700' }}>{expiringItems.length}</div>
                  <div className="text-xs" style={{ fontFamily: 'DM Sans', color: '#C97700' }}>Nearing Expiry</div>
                </div>
              </div>
            </Card>
            <Card className="!p-4">
              <div className="flex items-center gap-3">
                <Package size={20} className="text-[#888888]" />
                <div>
                  <div className="text-2xl font-bold" style={{ fontFamily: 'DM Sans' }}>
                    {inventoryItems.filter(i => i.status === 'expired').length}
                  </div>
                  <div className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>Expired</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[22px] font-bold" style={{ fontFamily: 'DM Sans' }}>Inventory</h1>
            <div className="flex gap-3">
              <Button variant="secondary" icon={<Box size={18} />} onClick={() => setShowPackModal(true)}>
                Pack Donation
              </Button>
              <Button variant="secondary" icon={<Upload size={18} />}>Upload Excel</Button>
              <Button variant="primary" icon={<Plus size={18} />}>Add Item</Button>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="border-2 border-dashed border-[#CCCCCC] rounded-[12px] bg-white h-20 mb-6 flex items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <CloudUpload size={24} className="text-[#888888]" />
              <span className="text-[13px] text-[#888888]" style={{ fontFamily: 'DM Sans' }}>
                Drag &amp; drop .xlsx file or click to browse
              </span>
            </div>
            <button className="text-[#FE9800] text-[13px] underline hover:text-[#C97700]" style={{ fontFamily: 'DM Sans' }}>
              Download template
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
              <input
                type="text"
                placeholder="Search by item name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-[#F5F5F5] border border-[#CCCCCC] rounded-lg text-sm placeholder:text-[#888888] focus:outline-none focus:border-[#FE9800] transition-colors"
                style={{ fontFamily: 'DM Sans' }}
              />
            </div>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-11 px-4 bg-[#F5F5F5] border border-[#CCCCCC] rounded-lg text-sm focus:outline-none focus:border-[#FE9800] transition-colors"
              style={{ fontFamily: 'DM Sans' }}>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-11 px-4 bg-[#F5F5F5] border border-[#CCCCCC] rounded-lg text-sm focus:outline-none focus:border-[#FE9800] transition-colors"
              style={{ fontFamily: 'DM Sans' }}>
              <option value="all">All Status</option>
              <option value="fresh">Fresh</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="flex gap-6">
            {/* Table */}
            <div className="flex-1">
              <Card className="!p-0 overflow-hidden">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#F5F5F5' }}>
                    <tr>
                      <th className="px-4 py-3 text-left"><input type="checkbox" className="w-4 h-4" /></th>
                      {['Item Name','Category','Quantity','Unit','Expiry Date','Status','Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs uppercase"
                          style={{ fontFamily: 'DM Sans', color: '#888888' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => (
                      <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#FAFAFA' }}>
                        <td className="px-4 py-3"><input type="checkbox" className="w-4 h-4" /></td>
                        <td className="px-4 py-3 text-sm" style={{ fontFamily: 'DM Sans' }}>{item.name}</td>
                        <td className="px-4 py-3 text-sm" style={{ fontFamily: 'DM Sans' }}>{item.category}</td>
                        <td className="px-4 py-3 text-sm" style={{ fontFamily: 'DM Sans' }}>{item.quantity}</td>
                        <td className="px-4 py-3 text-sm" style={{ fontFamily: 'DM Sans' }}>{item.unit}</td>
                        <td className="px-4 py-3 text-sm" style={{ fontFamily: 'DM Sans' }}>{item.expiryDate}</td>
                        <td className="px-4 py-3">
                          <Badge type={item.status}>
                            {item.status === 'fresh' ? 'Fresh' : item.status === 'expiring' ? 'Expiring' : 'Expired'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button className="text-[#888888] hover:text-[#FE9800]"><Pencil size={16} /></button>
                            <button className="text-[#888888] hover:text-[#E74C3C]"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-[#F0F0F0] px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-[#888888]" style={{ fontFamily: 'DM Sans' }}>
                    Showing {filteredItems.length} of {inventoryItems.length} items
                  </span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 border border-[#CCCCCC] rounded text-sm hover:bg-[#F5F5F5]" style={{ fontFamily: 'DM Sans' }}>Previous</button>
                    <button className="px-3 py-1 rounded text-sm text-white" style={{ backgroundColor: '#FE9800', fontFamily: 'DM Sans' }}>1</button>
                    <button className="px-3 py-1 border border-[#CCCCCC] rounded text-sm hover:bg-[#F5F5F5]" style={{ fontFamily: 'DM Sans' }}>Next</button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Expiring Soon */}
            <div className="w-60">
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={16} className="text-[#FE9800]" />
                  <h3 className="text-[14px] font-semibold text-[#FE9800]" style={{ fontFamily: 'DM Sans' }}>Expiring Soon</h3>
                </div>
                <div className="space-y-4">
                  {expiringItems.map((item) => (
                    <div key={item.id} className="pb-4 border-b border-[#F0F0F0] last:border-0">
                      <div className="text-sm font-semibold mb-1" style={{ fontFamily: 'DM Sans' }}>{item.name}</div>
                      <div className="text-xs text-[#888888] mb-1" style={{ fontFamily: 'DM Sans' }}>Expires: {item.expiryDate}</div>
                      <div className="text-xs text-[#888888] mb-2" style={{ fontFamily: 'DM Sans' }}>{item.quantity} {item.unit}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge type="warning">Expiring</Badge>
                        <button className="text-[#FE9800] text-xs underline hover:text-[#C97700]" style={{ fontFamily: 'DM Sans' }}>
                         Redistribute →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Pack Donation Modal */}
      <Modal isOpen={showPackModal} onClose={closeModal} title="Pack Donation Package" width="xl">
        <div className="space-y-4">
          <Input label="Package Name" placeholder="Enter package name (e.g., Family Relief Package)"
            value={packageName} onChange={(e) => setPackageName(e.target.value)} />
          <div className="border-t border-[#F0F0F0] pt-4">
            <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'DM Sans' }}>Select Items from Inventory</h3>
            <div className="max-h-[300px] overflow-y-auto space-y-2 mb-4">
              {inventoryItems.map((item) => {
                const inPackage = packageItems.find(pi => pi.item.id === item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-[#F5F5F5] rounded-lg hover:bg-[#ECECEC] transition-colors">
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ fontFamily: 'DM Sans' }}>{item.name}</div>
                      <div className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>Available: {item.quantity} {item.unit}</div>
                    </div>
                    {inPackage ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleQuantityChange(item.id, inPackage.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded text-white"
                          style={{ backgroundColor: '#CCCCCC' }}>
                          <Minus size={14} />
                        </button>
                        <span className="w-12 text-center text-sm font-semibold" style={{ fontFamily: 'DM Sans' }}>{inPackage.quantity}</span>
                        <button onClick={() => handleQuantityChange(item.id, inPackage.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded text-white"
                          style={{ backgroundColor: '#FE9800' }}>
                          <Plus size={14} />
                        </button>
                        <button onClick={() => handleRemoveFromPackage(item.id)}
                          className="ml-2 text-xs hover:underline" style={{ fontFamily: 'DM Sans', color: '#E74C3C' }}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleAddToPackage(item)}
                        className="px-3 py-1.5 rounded-lg text-white text-xs transition-colors"
                        style={{ backgroundColor: '#FE9800', fontFamily: 'DM Sans', fontWeight: 600 }}>
                        Add to Package
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {packageItems.length > 0 && (
              <div className="border-t border-[#F0F0F0] pt-4">
                <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'DM Sans' }}>Package Summary ({packageItems.length} items)</h4>
                <div className="rounded-lg p-3 space-y-1" style={{ backgroundColor: '#FFF3DC' }}>
                  {packageItems.map(pi => (
                    <div key={pi.item.id} className="flex justify-between text-xs" style={{ fontFamily: 'DM Sans' }}>
                      <span>{pi.item.name}</span>
                      <span className="font-semibold">{pi.quantity} {pi.item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 border-t border-[#F0F0F0] pt-4">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSavePackage}
              disabled={packageItems.length === 0 || !packageName.trim()}>
              Save Package
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}