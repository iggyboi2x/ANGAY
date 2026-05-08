import { useState, useEffect } from 'react';
import FoodbankSidebar from '../../components/foodbank/FoodbankSidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Package, Plus, Clock, CheckCircle2, Pencil, Trash2, Search, Minus, LayoutGrid, List } from 'lucide-react';
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
  { key: 'pending', label: 'Pending Confirmation' },
  { key: 'donated', label: 'Donated' },
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
  const [editingPkg, setEditingPkg] = useState(null);
  const [editName, setEditName] = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [pkgItems, setPkgItems] = useState([]);
  const [pkgSearch, setPkgSearch] = useState('');
  const [showPack, setShowPack] = useState(false);
  const [pkgName, setPkgName] = useState('');
  const [isSavingPkg, setIsSavingPkg] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [viewingItem, setViewingItem] = useState(null);

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
      .select('*, package_items(*), distributions(*)')
      .eq('foodbank_id', foodbankId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching packages:', error);
    } else {
      // Map distributions to the package for easier access
      const formatted = (data || []).map(p => {
        const dist = p.distributions?.[0];
        return {
          ...p,
          barangay_name: dist?.barangay_name || null,
          received_date: dist?.updated_at || dist?.created_at || null
        };
      });
      setPackages(formatted);
    }
    setLoading(false);
  };

  const openEditModal = async (pkg) => {
    setEditingPkg(pkg);
    setEditName(pkg.name);
    setPkgSearch('');

    const { data: inv } = await supabase.from('foodbank_inventory').select('*').eq('foodbank_id', foodbankId);

    const invMap = {};
    (inv || []).forEach(item => {
      invMap[item.id] = { ...item };
    });

    const loadedPkgItems = [];
    (pkg.package_items || []).forEach(pi => {
      if (pi.inventory_id && invMap[pi.inventory_id]) {
        invMap[pi.inventory_id].quantity = Number(invMap[pi.inventory_id].quantity) + Number(pi.quantity);
        loadedPkgItems.push({
          item: invMap[pi.inventory_id],
          qty: Number(pi.quantity)
        });
      } else {
        const mockItem = {
          id: pi.inventory_id || `mock-${pi.id}`,
          item_name: pi.item_name,
          quantity: Number(pi.quantity),
          unit: pi.unit,
          isDeleted: true
        };
        loadedPkgItems.push({
          item: mockItem,
          qty: Number(pi.quantity)
        });
      }
    });

    setInventoryItems(Object.values(invMap));
    setPkgItems(loadedPkgItems);
  };

  const openPackModal = async () => {
    setPkgName('');
    setPkgItems([]);
    setPkgSearch('');
    const { data: inv } = await supabase.from('foodbank_inventory').select('*').eq('foodbank_id', foodbankId);
    setInventoryItems(inv || []);
    setShowPack(true);
  };

  function addToPkg(item) {
    const ex = pkgItems.find(p => p.item.id === item.id);
    if (ex) setPkgItems(pkgItems.map(p => p.item.id === item.id ? { ...p, qty: Math.min(p.qty + 1, item.quantity) } : p));
    else setPkgItems([...pkgItems, { item, qty: 1 }]);
  }
  function changeQty(id, q) { setPkgItems(pkgItems.map(p => p.item.id === id ? { ...p, qty: Math.max(1, Math.min(q, p.item.quantity)) } : p)); }
  function removePkg(id) { setPkgItems(pkgItems.filter(p => p.item.id !== id)); }

  const handleEditSave = async () => {
    if (!editName.trim() || !editingPkg || isSavingPkg) return;
    setIsSavingPkg(true);

    try {
      const { data: originalItems } = await supabase.from('package_items').select('*').eq('package_id', editingPkg.id);
      if (originalItems) {
        for (const pi of originalItems) {
          if (pi.inventory_id) {
            const { data: inv } = await supabase.from('foodbank_inventory').select('quantity').eq('id', pi.inventory_id).maybeSingle();
            if (inv) {
              await supabase.from('foodbank_inventory').update({ quantity: Number(inv.quantity) + Number(pi.quantity) }).eq('id', pi.inventory_id);
            }
          }
        }
      }

      await supabase.from('package_items').delete().eq('package_id', editingPkg.id);
      await supabase.from('donation_packages').update({ name: editName }).eq('id', editingPkg.id);

      for (const p of pkgItems) {
        if (p.item.isDeleted) {
          await supabase.from('package_items').insert([{
            package_id: editingPkg.id,
            inventory_id: p.item.id.startsWith('mock-') ? null : p.item.id,
            item_name: p.item.item_name,
            quantity: p.qty,
            unit: p.item.unit
          }]);
        } else {
          await supabase.from('package_items').insert([{
            package_id: editingPkg.id,
            inventory_id: p.item.id,
            item_name: p.item.item_name,
            quantity: p.qty,
            unit: p.item.unit
          }]);

          const { data: inv } = await supabase.from('foodbank_inventory').select('quantity').eq('id', p.item.id).maybeSingle();
          if (inv) {
            const newQty = Number(inv.quantity) - p.qty;
            if (newQty <= 0) {
              await supabase.from('foodbank_inventory').delete().eq('id', p.item.id);
            } else {
              await supabase.from('foodbank_inventory').update({ quantity: newQty }).eq('id', p.item.id);
            }
          }
        }
      }

      setFlash({ type: 'success', message: 'Package updated!' });
      fetchPackages();
      setEditingPkg(null);
    } catch (err) {
      console.error(err);
      setFlash({ type: 'error', message: 'Error updating package.' });
    } finally {
      setIsSavingPkg(false);
    }
  };

  const savePkg = async () => {
    if (!pkgItems.length || !pkgName.trim() || !foodbankId || isSavingPkg) return;
    setIsSavingPkg(true);

    try {
      const { data: pkg, error: pkgErr } = await supabase
        .from('donation_packages')
        .insert([{
          name: pkgName,
          foodbank_id: foodbankId,
          status: 'available'
        }])
        .select()
        .single();

      if (pkgErr) throw pkgErr;

      for (const p of pkgItems) {
        await supabase.from('package_items').insert([{
          package_id: pkg.id,
          inventory_id: p.item.id,
          item_name: p.item.item_name,
          quantity: p.qty,
          unit: p.item.unit,
          source_donation_id: p.item.source_donation_id
        }]);

        const newQty = Number(p.item.quantity) - p.qty;
        if (newQty <= 0) {
          await supabase.from('foodbank_inventory').delete().eq('id', p.item.id);
        } else {
          await supabase.from('foodbank_inventory').update({ quantity: newQty }).eq('id', p.item.id);
        }
      }

      setFlash({ type: 'success', message: `Package "${pkgName}" saved!` });
      setShowPack(false);
      fetchPackages();
    } catch (err) {
      console.error(err);
      setFlash({ type: 'error', message: 'Failed to save package.' });
    } finally {
      setIsSavingPkg(false);
    }
  };

  const handleDelete = async (pkg) => {
    if (!window.confirm(`Are you sure you want to delete "${pkg.name}"? Items will be restored to your inventory.`)) return;

    const { data: items } = await supabase.from('package_items').select('*').eq('package_id', pkg.id);
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.inventory_id) {
          const { data: inv } = await supabase.from('foodbank_inventory').select('quantity').eq('id', item.inventory_id).maybeSingle();
          if (inv) {
            await supabase.from('foodbank_inventory').update({ quantity: Number(inv.quantity) + Number(item.quantity) }).eq('id', item.inventory_id);
          }
        }
      }
    }

    await supabase.from('donation_packages').delete().eq('id', pkg.id);
    setFlash({ type: 'success', message: 'Package deleted and items restored.' });
    fetchPackages();
  };

  const handleSend = async (form) => {
    const bay = barangays.find(b => b.id === form.barangay_id);
    const { error: distError } = await supabase.from('distributions').insert({
      foodbank_id: foodbankId,
      barangay_id: form.barangay_id,
      foodbank_name: displayName,
      barangay_name: bay?.barangay_name || '',
      items: form.items,
      notes: form.notes || null,
      scheduled_date: form.scheduled_date,
      status: 'pending',
      package_id: form.package_id || null,
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
    pending: packages.filter(p => p.status === 'pending').length,
    donated: packages.filter(p => p.status === 'donated').length,
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
          <Button variant="primary" icon={<Plus size={16} />} onClick={openPackModal}>
            New Package
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2 bg-[#F5F5F5] p-1.5 rounded-[18px] w-fit">
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
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === key ? 'bg-[#FE9800] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex bg-[#F5F5F5] p-1.5 rounded-[18px]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-[#FE9800] shadow-sm' : 'text-[#888888]'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-[#FE9800] shadow-sm' : 'text-[#888888]'}`}
            >
              <List size={18} />
            </button>
          </div>
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
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filtered.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onSend={() => {
                  setSelectedPkgId(pkg.id);
                  setShowSendModal(true);
                }}
                onEdit={() => openEditModal(pkg)}
                onDelete={() => handleDelete(pkg)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filtered.map((pkg) => (
              <PackageListRow
                key={pkg.id}
                pkg={pkg}
                onClick={() => setViewingItem(pkg)}
                onSend={() => {
                  setSelectedPkgId(pkg.id);
                  setShowSendModal(true);
                }}
                onEdit={() => openEditModal(pkg)}
                onDelete={() => handleDelete(pkg)}
              />
            ))}
          </div>
        )}
      </div>

      {viewingItem && (
        <div 
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto" 
          onClick={() => setViewingItem(null)}
        >
          <div 
            className="w-full max-w-[500px] animate-in fade-in zoom-in duration-300"
            onClick={e => e.stopPropagation()}
          >
            <PackageCard
              pkg={viewingItem}
              onSend={() => {
                setSelectedPkgId(viewingItem.id);
                setShowSendModal(true);
                setViewingItem(null);
              }}
              onEdit={() => {
                openEditModal(viewingItem);
                setViewingItem(null);
              }}
              onDelete={() => {
                handleDelete(viewingItem);
                setViewingItem(null);
              }}
            />

            <button
              onClick={() => setViewingItem(null)}
              className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-white/20 transition-all backdrop-blur-md"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {showSendModal && (
        <SendFoodAidModal
          barangays={barangays}
          packages={packages}
          initialPackageId={selectedPkgId}
          onClose={() => setShowSendModal(false)}
          onSubmit={handleSend}
        />
      )}

      <Modal isOpen={!!editingPkg} onClose={() => setEditingPkg(null)} title="Edit Donation Package" width="xl">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Package Name</label>
            <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="e.g. Family Relief Package"
              className="w-full h-10 px-3 border border-[#CCCCCC] rounded-lg text-sm focus:outline-none focus:border-[#FE9800]" style={{ fontFamily: 'DM Sans' }} />
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="text"
              placeholder="Search items to add..."
              value={pkgSearch}
              onChange={e => setPkgSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-[#F5F5F5] border border-[#EEEEEE] rounded-lg text-xs focus:outline-none focus:border-[#FE9800]"
              style={{ fontFamily: 'DM Sans' }}
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {inventoryItems
              .filter(i => i.item_name.toLowerCase().includes(pkgSearch.toLowerCase()))
              .map(item => {
                const inPkg = pkgItems.find(p => p.item.id === item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-[#F5F5F5] rounded-lg border border-transparent hover:border-[#FE9800]/20 transition-all">
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: 'DM Sans' }}>{item.item_name}</p>
                      <p className="text-[11px] text-[#888]">Available: {Number(item.quantity).toLocaleString()} {item.unit}</p>
                    </div>
                    {inPkg ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => changeQty(item.id, inPkg.qty - 1)} className="w-7 h-7 bg-gray-200 text-[#555] rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"><Minus size={13} /></button>
                        <span className="w-8 text-center text-sm font-bold">{inPkg.qty}</span>
                        <button onClick={() => changeQty(item.id, inPkg.qty + 1)} className="w-7 h-7 bg-[#FE9800] text-white rounded-lg flex items-center justify-center hover:bg-[#e58a00] transition-colors"><Plus size={13} /></button>
                        <button onClick={() => removePkg(item.id)} className="text-[10px] text-red-500 ml-1 font-bold uppercase tracking-wider">Remove</button>
                      </div>
                    ) : (
                      <button onClick={() => addToPkg(item)} className="px-4 py-1.5 bg-[#FE9800] text-white text-xs rounded-lg font-bold hover:bg-[#e58a00] transition-colors">Add</button>
                    )}
                  </div>
                );
              })}

            {pkgItems.filter(p => p.item.isDeleted && p.item.item_name.toLowerCase().includes(pkgSearch.toLowerCase())).map(p => (
              <div key={p.item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <p className="text-sm font-semibold text-red-700" style={{ fontFamily: 'DM Sans' }}>{p.item.item_name} (Deleted from Inventory)</p>
                  <p className="text-[11px] text-red-400">Available: {Number(p.item.quantity).toLocaleString()} {p.item.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeQty(p.item.id, p.qty - 1)} className="w-7 h-7 bg-red-200 text-red-700 rounded-lg flex items-center justify-center hover:bg-red-300 transition-colors"><Minus size={13} /></button>
                  <span className="w-8 text-center text-sm font-bold text-red-700">{p.qty}</span>
                  <button onClick={() => changeQty(p.item.id, p.qty + 1)} className="w-7 h-7 bg-red-400 text-white rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors"><Plus size={13} /></button>
                  <button onClick={() => removePkg(p.item.id)} className="text-[10px] text-red-500 ml-1 font-bold uppercase tracking-wider">Remove</button>
                </div>
              </div>
            ))}

            {inventoryItems.filter(i => i.item_name.toLowerCase().includes(pkgSearch.toLowerCase())).length === 0 &&
              pkgItems.filter(p => p.item.isDeleted && p.item.item_name.toLowerCase().includes(pkgSearch.toLowerCase())).length === 0 && (
                <div className="py-8 text-center text-xs text-gray-400">No items matching "{pkgSearch}"</div>
              )}
          </div>
          {pkgItems.length > 0 && (
            <div className="bg-[#FFF3DC] rounded-lg p-3 space-y-1">
              <p className="text-xs font-bold mb-2">Summary ({pkgItems.length} items)</p>
              {pkgItems.map(p => (
                <div key={p.item.id} className="flex justify-between text-xs">
                  <span>{p.item.item_name}</span><span className="font-bold">{p.qty} {p.item.unit}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-3 border-t pt-3">
            <Button variant="ghost" onClick={() => setEditingPkg(null)} disabled={isSavingPkg}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSave} disabled={!pkgItems.length || !editName.trim() || isSavingPkg}>
              {isSavingPkg ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── New Package (Pack) Modal ── */}
      <Modal isOpen={showPack} onClose={() => setShowPack(false)} title="Pack New Donation Package" width="xl">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Package Name</label>
            <input value={pkgName} onChange={e => setPkgName(e.target.value)} placeholder="e.g. Family Relief Package"
              className="w-full h-10 px-3 border border-[#CCCCCC] rounded-lg text-sm focus:outline-none focus:border-[#FE9800]" style={{ fontFamily: 'DM Sans' }} />
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="text"
              placeholder="Search items to add..."
              value={pkgSearch}
              onChange={e => setPkgSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-[#F5F5F5] border border-[#EEEEEE] rounded-lg text-xs focus:outline-none focus:border-[#FE9800]"
              style={{ fontFamily: 'DM Sans' }}
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {inventoryItems
              .filter(i => i.item_name.toLowerCase().includes(pkgSearch.toLowerCase()))
              .map(item => {
                const inPkg = pkgItems.find(p => p.item.id === item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-[#F5F5F5] rounded-lg border border-transparent hover:border-[#FE9800]/20 transition-all">
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: 'DM Sans' }}>{item.item_name}</p>
                      <p className="text-[11px] text-[#888]">Available: {Number(item.quantity).toLocaleString()} {item.unit}</p>
                    </div>
                    {inPkg ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => changeQty(item.id, inPkg.qty - 1)} className="w-7 h-7 bg-gray-200 text-[#555] rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"><Minus size={13} /></button>
                        <span className="w-8 text-center text-sm font-bold">{inPkg.qty}</span>
                        <button onClick={() => changeQty(item.id, inPkg.qty + 1)} className="w-7 h-7 bg-[#FE9800] text-white rounded-lg flex items-center justify-center hover:bg-[#e58a00] transition-colors"><Plus size={13} /></button>
                        <button onClick={() => removePkg(item.id)} className="text-[10px] text-red-500 ml-1 font-bold uppercase tracking-wider">Remove</button>
                      </div>
                    ) : (
                      <button onClick={() => addToPkg(item)} className="px-4 py-1.5 bg-[#FE9800] text-white text-xs rounded-lg font-bold hover:bg-[#e58a00] transition-colors">Add</button>
                    )}
                  </div>
                );
              })}
            {inventoryItems.filter(i => i.item_name.toLowerCase().includes(pkgSearch.toLowerCase())).length === 0 && (
              <div className="py-8 text-center text-xs text-gray-400">No items matching "{pkgSearch}"</div>
            )}
          </div>
          {pkgItems.length > 0 && (
            <div className="bg-[#FFF3DC] rounded-lg p-3 space-y-1">
              <p className="text-xs font-bold mb-2">Summary ({pkgItems.length} items)</p>
              {pkgItems.map(p => (
                <div key={p.item.id} className="flex justify-between text-xs">
                  <span>{p.item.item_name}</span><span className="font-bold">{p.qty} {p.item.unit}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-3 border-t pt-3">
            <Button variant="ghost" onClick={() => { setShowPack(false); setPkgItems([]); setPkgName(''); setPkgSearch(''); }} disabled={isSavingPkg}>Cancel</Button>
            <Button variant="primary" onClick={savePkg} disabled={!pkgItems.length || !pkgName.trim() || isSavingPkg}>
              {isSavingPkg ? 'Saving...' : 'Save Package'}
            </Button>
          </div>
        </div>
      </Modal>

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
function PackageListRow({ pkg, onClick, onSend, onEdit, onDelete }) {
  const isDonated = pkg.status === 'donated';
  const isPending = pkg.status === 'pending';

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between group hover:border-[#FE9800]/30 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isDonated ? 'bg-gray-100' : isPending ? 'bg-blue-50' : 'bg-[#FFF3DC]'}`}>
          <Package size={20} className={isDonated ? 'text-gray-400' : isPending ? 'text-blue-500' : 'text-[#FE9800]'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[#1A1A1A] truncate">{pkg.name}</p>
            <StatusBadge status={pkg.status} />
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {pkg.package_items?.length || 0} items · {isPending ? `Sent to ${pkg.barangay_name}` : isDonated ? `Received by ${pkg.barangay_name}` : 'Ready for distribution'}
          </p>
        </div>
        <div className="hidden lg:block px-6 border-l border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Created</p>
          <p className="text-xs font-semibold text-[#1A1A1A] mt-0.5">{new Date(pkg.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4" onClick={e => e.stopPropagation()}>
        {!isDonated && !isPending && (
          <>
            <button onClick={onEdit} className="p-2 text-[#AAAAAA] hover:text-[#FE9800] hover:bg-orange-50 rounded-lg transition-colors"><Pencil size={15} /></button>
            <button onClick={onDelete} className="p-2 text-[#AAAAAA] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
            <button onClick={onSend} className="px-4 py-2 bg-[#FE9800] text-white text-[10px] font-black uppercase rounded-lg">Send</button>
          </>
        )}
        {isPending && (
          <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">In Transit</span>
        )}
        {isDonated && (
          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-wider">Received</span>
        )}
      </div>
    </div>
  );
}

function PackageCard({ pkg, onSend, onEdit, onDelete }) {
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
            {isDonated && pkg.barangay_name && (
              <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wide mt-0.5" style={{ fontFamily: 'DM Sans' }}>
                <div>Sent to: {pkg.barangay_name}</div>
                <div className="mt-0.5 text-[#AAAAAA]">Received: {pkg.received_date ? new Date(pkg.received_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}</div>
              </div>
            )}
            <div className="text-xs text-[#888888] mt-0.5" style={{ fontFamily: 'DM Sans' }}>
              Created: {new Date(pkg.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={pkg.status} />
          {!isDonated && !isPending && (
            <div className="flex gap-2.5 mt-1">
              <button onClick={() => onEdit(pkg)} className="text-[#AAAAAA] hover:text-[#FE9800] transition-colors"><Pencil size={15} /></button>
              <button onClick={() => onDelete(pkg.id)} className="text-[#AAAAAA] hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
            </div>
          )}
        </div>
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
