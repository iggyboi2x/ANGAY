import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import FoodbankSidebar from '../../components/foodbank/FoodbankSidebar';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { supabase } from '../../../supabase';
import { useProfile } from '../../hooks/useProfile';
import {
  Package, AlertTriangle, CloudUpload, Search,
  Box, Upload, Plus, Pencil, Trash2, Minus, Download, X, Check, ChevronDown, MoreVertical, Menu
} from 'lucide-react';
import FlashMessage from '../../components/FlashMessage';
import ConfirmModal from '../../components/ConfirmModal';

const COLUMNS = ['Item Name', 'Category', 'Quantity', 'Unit', 'Expiration Date'];
const UNITS = ['kg', 'g', 'pcs', 'cans', 'packs', 'liters', 'bottles', 'boxes', 'sachets'];

function computeStatus(expDate) {
  if (!expDate) return 'fresh';
  const d = new Date(expDate);
  const now = new Date();
  const days = Math.ceil((d - now) / 86400000);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'fresh';
}

function StatusBadge({ status }) {
  const map = { fresh: 'bg-green-100 text-green-700', expiring: 'bg-yellow-100 text-yellow-700', expired: 'bg-red-100 text-red-700' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${map[status] || map.fresh}`}>{status}</span>;
}

export default function FoodbankInventory() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { id: foodbankId } = useProfile();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add/Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ item_name: '', category_id: '', quantity: '', unit: 'kg', expiration_date: '' });

  // Excel review modal
  const [reviewRows, setReviewRows] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewErrors, setReviewErrors] = useState({});

  const [flash, setFlash] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [showDropdown, setShowDropdown] = useState(false);

  const fileRef = useRef();
  const dropdownRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (foodbankId) { fetchCategories(); fetchItems(); }
  }, [foodbankId]);

  async function fetchCategories() {
    const { data } = await supabase.from('item_categories').select('*').order('name');
    setCategories(data || []);
  }

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase
      .from('foodbank_inventory')
      .select('*, item_categories(name)')
      .eq('foodbank_id', foodbankId)
      .order('created_at', { ascending: false });
    setItems((data || []).map(r => ({ ...r, category: r.item_categories?.name || '—' })));
    setLoading(false);
  }

  const filtered = items.filter(i => {
    const ms = i.item_name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'all' || i.category === catFilter;
    const ms2 = statusFilter === 'all' || i.status === statusFilter;
    return ms && mc && ms2;
  });

  const totalQty = items.reduce((s, i) => s + Number(i.quantity), 0);
  const expiring = items.filter(i => i.status === 'expiring');
  const expired = items.filter(i => i.status === 'expired');
  const uniqueCats = ['all', ...new Set(items.map(i => i.category))];

  // ─── Add/Edit ───
  function openAdd() { setEditing(null); setForm({ item_name: '', category_id: '', quantity: '', unit: 'kg', expiration_date: '' }); setShowForm(true); }
  function openEdit(item) {
    setEditing(item);
    setForm({ item_name: item.item_name, category_id: item.category_id || '', quantity: item.quantity, unit: item.unit, expiration_date: item.expiration_date || '' });
    setShowForm(true);
  }

  async function handleSaveItem() {
    if (!form.item_name || !form.quantity) return;
    const payload = { ...form, quantity: Number(form.quantity), foodbank_id: foodbankId, status: computeStatus(form.expiration_date) };
    try {
      if (editing) {
        await supabase.from('foodbank_inventory').update(payload).eq('id', editing.id);
        setFlash({ type: 'success', message: 'Item updated successfully!' });
      } else {
        await supabase.from('foodbank_inventory').insert([payload]);
        setFlash({ type: 'success', message: 'Item added successfully!' });
      }
      setShowForm(false);
      fetchItems();
    } catch (err) {
      setFlash({ type: 'error', message: 'Failed to save item.' });
    }
  }

  async function handleDelete(id) {
    setConfirm({
      open: true,
      title: 'Delete Item',
      message: 'Are you sure you want to remove this item from your inventory?',
      onConfirm: async () => {
        try {
          await supabase.from('foodbank_inventory').delete().eq('id', id);
          setFlash({ type: 'success', message: 'Item deleted successfully!' });
          fetchItems();
        } catch (err) {
          setFlash({ type: 'error', message: 'Failed to delete item.' });
        }
      }
    });
  }

  // ─── Excel Download ───
  function exportToExcel() {
    const data = items.map(item => ({
      'Item Name': item.item_name,
      'Category': item.category,
      'Quantity': Number(item.quantity),
      'Unit': item.unit,
      'Expiration Date': item.expiration_date || 'N/A',
      'Status': item.status.toUpperCase()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Current Inventory');
    XLSX.writeFile(wb, `ANGAY_Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([COLUMNS, ['White Rice', 'Grains', 100, 'kg', '2026-12-31']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'inventory_template.xlsx');
  }

  // ─── Excel Upload ───
  function handleFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const data = rows.slice(1).filter(r => r.some(c => c !== undefined && c !== ''));
      const errors = {};
      data.forEach((row, ri) => {
        COLUMNS.forEach((col, ci) => {
          const val = row[ci];
          if (col === 'Quantity') {
            if (val === undefined || val === '' || isNaN(Number(val)) || Number(val) < 0)
              errors[`${ri}-${ci}`] = true;
          } else if (col === 'Unit') {
            if (val === undefined || val === '' || !isNaN(Number(val)))
              errors[`${ri}-${ci}`] = true;
          } else {
            if (val === undefined || val === '') errors[`${ri}-${ci}`] = true;
          }
        });
      });
      setReviewRows(data.map(r => [...r]));
      setReviewErrors(errors);
      setShowReview(true);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  }

  function updateReviewCell(ri, ci, val) {
    setReviewRows(prev => { const n = prev.map(r => [...r]); n[ri][ci] = val; return n; });
    const key = `${ri}-${ci}`;
    const col = COLUMNS[ci];
    let err = false;
    if (col === 'Quantity') err = val === '' || isNaN(Number(val)) || Number(val) < 0;
    else if (col === 'Unit') err = val === '' || !isNaN(Number(val));
    else err = val === '' || val === undefined;
    setReviewErrors(prev => { const n = { ...prev }; err ? (n[key] = true) : delete n[key]; return n; });
  }

  async function importReview() {
    if (Object.keys(reviewErrors).length > 0) return;
    const rows = reviewRows.map(r => {
      const catObj = categories.find(c => c.name.toLowerCase() === String(r[1] || '').toLowerCase());
      return {
        foodbank_id: foodbankId,
        item_name: r[0],
        category_id: catObj?.id || null,
        quantity: Number(r[2]),
        unit: r[3] || 'pcs',
        expiration_date: r[4] || null,
        status: computeStatus(r[4])
      };
    });
    await supabase.from('foodbank_inventory').insert(rows);
    setFlash({ type: 'success', message: `Successfully imported ${rows.length} items!` });
    setShowReview(false);
    fetchItems();
  }



  return (
    <div className="flex min-h-screen bg-white relative overflow-x-hidden">
      <FoodbankSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="md:ml-60 flex-1 flex flex-col w-full min-w-0">
        
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-[#F0F0F0] flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Re-using the Menu icon logic from dashboard */}
            <button className="md:hidden p-2 -ml-2 text-[#888888] hover:text-[#FE9800]" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-[#F5F5F5] rounded-lg px-3 py-2 border border-[#EBEBEB] w-64 md:w-72">
              <Search size={14} className="text-[#888888]" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory…"
                className="bg-transparent text-sm text-[#555] outline-none w-full placeholder:text-[#AAAAAA]"
                style={{ fontFamily: 'DM Sans' }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openAdd} className="sm:hidden">Add</Button>
            <div className="w-9 h-9 rounded-full bg-[#FE9800] text-white text-xs font-bold flex items-center justify-center">
              FB
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total SKUs', value: items.length, icon: <Package size={20} className="text-[#FE9800]" /> },
              { label: 'Total Items', value: totalQty.toLocaleString(), icon: <Package size={20} className="text-[#FE9800]" /> },
              { label: 'Nearing Expiry', value: expiring.length, icon: <AlertTriangle size={20} className="text-yellow-600" />, warn: true },
              { label: 'Expired', value: expired.length, icon: <Package size={20} className="text-red-400" /> },
            ].map(({ label, value, icon, warn }) => (
              <Card key={label} className={`!p-4 ${warn ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  {icon}
                  <div>
                    <div className={`text-xl sm:text-2xl font-bold ${warn ? 'text-yellow-700' : ''}`} style={{ fontFamily: 'DM Sans' }}>{value}</div>
                    <div className="text-[10px] sm:text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>{label}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h1 className="text-[22px] font-bold" style={{ fontFamily: 'DM Sans' }}>Inventory</h1>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              <div className="relative shrink-0" ref={dropdownRef}>
                <Button 
                  variant="secondary" 
                  icon={<ChevronDown size={16} />} 
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  Actions
                </Button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#F0F0F0] rounded-xl shadow-[0px_10px_30px_rgba(0,0,0,0.08)] z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={() => { exportToExcel(); setShowDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1A1A1A] hover:bg-gray-50 transition-colors"
                    >
                      <Download size={15} className="text-[#888]" />
                      <span className="font-medium">Export Inventory</span>
                    </button>
                    <button 
                      onClick={() => { downloadTemplate(); setShowDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1A1A1A] hover:bg-gray-50 transition-colors"
                    >
                      <Download size={15} className="text-[#888]" />
                      <span className="font-medium">Download Template</span>
                    </button>
                    <div className="h-px bg-[#F0F0F0] my-1 mx-2" />
                    <button 
                      onClick={() => { fileRef.current?.click(); setShowDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1A1A1A] hover:bg-gray-50 transition-colors"
                    >
                      <Upload size={15} className="text-[#888]" />
                      <span className="font-medium">Upload Excel</span>
                    </button>
                  </div>
                )}
              </div>
              
              <Button variant="primary" icon={<Plus size={16} />} onClick={openAdd} className="hidden sm:flex">Add Item</Button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            </div>
          </div>

          {/* Drop zone */}
          <div
            className="hidden sm:flex border-2 border-dashed border-[#CCCCCC] rounded-xl h-20 mb-6 items-center justify-center gap-6 cursor-pointer hover:border-[#FE9800] transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const ev = { target: { files: [f], value: '' } }; handleFile(ev); } }}
          >
            <CloudUpload size={22} className="text-[#888888]" />
            <span className="text-sm text-[#888888]" style={{ fontFamily: 'DM Sans' }}>Drag &amp; drop .xlsx or click to browse</span>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1 relative md:hidden">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search item or category..."
                className="w-full h-10 pl-9 pr-3 bg-[#F5F5F5] border border-[#CCCCCC] rounded-lg text-sm focus:outline-none focus:border-[#FE9800]" style={{ fontFamily: 'DM Sans' }} />
            </div>
            <div className="flex gap-2">
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="flex-1 h-10 px-3 bg-[#F5F5F5] border border-[#CCCCCC] rounded-lg text-sm focus:outline-none focus:border-[#FE9800]" style={{ fontFamily: 'DM Sans' }}>
                {uniqueCats.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="flex-1 h-10 px-3 bg-[#F5F5F5] border border-[#CCCCCC] rounded-lg text-sm focus:outline-none focus:border-[#FE9800]" style={{ fontFamily: 'DM Sans' }}>
                <option value="all">All Status</option>
                <option value="fresh">Fresh</option>
                <option value="expiring">Expiring</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-5">
            {/* Table */}
            <div className="flex-1 min-w-0">
              <Card className="!p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-[#F5F5F5]">
                      <tr>
                        {['Item Name', 'Category', 'Qty', 'Unit', 'Expiry', 'Status', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs uppercase text-[#888888]" style={{ fontFamily: 'DM Sans' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Loading…</td></tr>
                      ) : filtered.length === 0 ? (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No items found.</td></tr>
                      ) : filtered.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                          <td className="px-4 py-3 text-sm font-medium" style={{ fontFamily: 'DM Sans' }}>{item.item_name}</td>
                          <td className="px-4 py-3 text-sm text-[#555]" style={{ fontFamily: 'DM Sans' }}>{item.category}</td>
                          <td className="px-4 py-3 text-sm font-bold" style={{ fontFamily: 'DM Sans' }}>{Number(item.quantity).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-[#555]" style={{ fontFamily: 'DM Sans' }}>{item.unit}</td>
                          <td className="px-4 py-3 text-sm text-[#555]" style={{ fontFamily: 'DM Sans' }}>{item.expiration_date || '—'}</td>
                          <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => openEdit(item)} className="text-[#888] hover:text-[#FE9800] transition-colors"><Pencil size={15} /></button>
                              <button onClick={() => handleDelete(item.id)} className="text-[#888] hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-[#F0F0F0] px-4 py-3">
                  <span className="text-xs text-[#888]" style={{ fontFamily: 'DM Sans' }}>Showing {filtered.length} of {items.length} items</span>
                </div>
              </Card>
            </div>

            {/* Expiring Soon */}
            <div className="w-full lg:w-56 shrink-0">
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={15} className="text-[#FE9800]" />
                  <h3 className="text-sm font-bold text-[#FE9800]" style={{ fontFamily: 'DM Sans' }}>Expiring Soon</h3>
                </div>
                <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                  {expiring.length === 0
                    ? <p className="text-xs text-gray-400">None expiring soon.</p>
                    : expiring.map(item => (
                      <div key={item.id} className="min-w-[150px] lg:min-w-0 pb-3 lg:mb-3 border lg:border-0 border-[#F0F0F0] rounded-xl lg:rounded-none p-3 lg:p-0 lg:border-b last:border-0 last:mb-0">
                        <p className="text-xs font-bold" style={{ fontFamily: 'DM Sans' }}>{item.item_name}</p>
                        <p className="text-[10px] text-[#888]">Exp: {item.expiration_date}</p>
                        <p className="text-[10px] text-[#888]">{Number(item.quantity).toLocaleString()} {item.unit}</p>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Item' : 'Add Inventory Item'}>
        <div className="space-y-3">
          {[
            { label: 'Item Name', field: 'item_name', type: 'text' },
            { label: 'Quantity', field: 'quantity', type: 'number' },
            { label: 'Expiration Date', field: 'expiration_date', type: 'date' },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-[#555] mb-1" style={{ fontFamily: 'DM Sans' }}>{label}</label>
              <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} min={type === 'number' ? 0 : undefined}
                className="w-full h-10 px-3 border border-[#CCCCCC] rounded-lg text-sm focus:outline-none focus:border-[#FE9800]" style={{ fontFamily: 'DM Sans' }} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1">Category</label>
            <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="w-full h-10 px-3 border border-[#CCCCCC] rounded-lg text-sm focus:outline-none focus:border-[#FE9800]" style={{ fontFamily: 'DM Sans' }}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1">Unit</label>
            <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              className="w-full h-10 px-3 border border-[#CCCCCC] rounded-lg text-sm focus:outline-none focus:border-[#FE9800]" style={{ fontFamily: 'DM Sans' }}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveItem} disabled={!form.item_name || !form.quantity}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* ── Excel Review Modal ── */}
      {showReview && reviewRows && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
              <div>
                <h2 className="text-base font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Review Uploaded Data</h2>
                {Object.keys(reviewErrors).length > 0
                  ? <p className="text-xs text-red-500 mt-0.5">Fix highlighted cells before importing.</p>
                  : <p className="text-xs text-green-600 mt-0.5">All rows look good. Ready to import.</p>}
              </div>
              <button onClick={() => setShowReview(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>{COLUMNS.map((c, i) => <th key={i} className="px-3 py-2 bg-[#F5F5F5] text-left text-xs font-bold text-[#555] border border-[#E0E0E0]">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {reviewRows.map((row, ri) => (
                    <tr key={ri}>
                      {COLUMNS.map((col, ci) => {
                        const err = reviewErrors[`${ri}-${ci}`];
                        return (
                          <td key={ci} className={`border border-[#E0E0E0] p-0 ${err ? 'bg-red-50' : ''}`}>
                            <input
                              type={col === 'Quantity' ? 'number' : col === 'Expiration Date' ? 'date' : 'text'}
                              value={row[ci] ?? ''}
                              onChange={e => updateReviewCell(ri, ci, e.target.value)}
                              min={col === 'Quantity' ? 0 : undefined}
                              className={`w-full px-3 py-2 text-sm outline-none bg-transparent ${err ? 'placeholder:text-red-300' : ''}`}
                              style={{ fontFamily: 'DM Sans', color: err ? '#dc2626' : '#1A1A1A' }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#F0F0F0]">
              <Button variant="ghost" onClick={() => setShowReview(false)}>Cancel</Button>
              <Button variant="primary" icon={<Check size={15} />} onClick={importReview} disabled={Object.keys(reviewErrors).length > 0}>
                Import {reviewRows.length} Row{reviewRows.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}



      <ConfirmModal
        isOpen={confirm.open}
        onClose={() => setConfirm({ ...confirm, open: false })}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
      />

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