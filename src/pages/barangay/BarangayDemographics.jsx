import { useState } from 'react';
import BarangaySidebar from '../../components/barangay/BarangaySidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Users, UserCheck, Baby, Heart, CloudUpload, Upload, Plus, Pencil, Trash2, X, Check } from 'lucide-react';

const initialHouseholds = [
  { id: 1, head: 'Juan Dela Cruz', address: '123 Main St',   members: 5, pwd: 0, seniors: 1, children: 2, pregnant: 0 },
  { id: 2, head: 'Maria Santos',   address: '456 Oak Ave',   members: 4, pwd: 1, seniors: 0, children: 1, pregnant: 1 },
  { id: 3, head: 'Pedro Reyes',    address: '789 Pine Rd',   members: 6, pwd: 0, seniors: 2, children: 3, pregnant: 0 },
  { id: 4, head: 'Ana Cruz',       address: '321 Maple Dr',  members: 3, pwd: 0, seniors: 0, children: 1, pregnant: 0 },
];

const COLS = ['Household Head','Address','Members','PWD','Seniors','Children','Pregnant','Actions'];

const emptyForm = { head: '', address: '', members: '', pwd: '', seniors: '', children: '', pregnant: '' };

export default function BarangayDemographics() {
  const [households, setHouseholds] = useState(initialHouseholds);
  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState(emptyForm);

  const totals = households.reduce((acc, h) => ({
    hh: acc.hh + 1,
    pop: acc.pop + h.members,
    pwd: acc.pwd + h.pwd,
    seniors: acc.seniors + h.seniors,
    children: acc.children + h.children,
    pregnant: acc.pregnant + h.pregnant,
  }), { hh: 0, pop: 0, pwd: 0, seniors: 0, children: 0, pregnant: 0 });

  const stats = [
    { label: 'Total HH',       value: totals.hh       },
    { label: 'Total Population',value: totals.pop      },
    { label: 'PWD',            value: totals.pwd       },
    { label: 'Seniors',        value: totals.seniors   },
    { label: 'Children U5',    value: totals.children  },
    { label: 'Pregnant',       value: totals.pregnant  },
  ];

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (h) => {
    setForm({ head: h.head, address: h.address, members: h.members, pwd: h.pwd,
      seniors: h.seniors, children: h.children, pregnant: h.pregnant });
    setEditId(h.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.head.trim()) return;
    const entry = {
      head: form.head, address: form.address,
      members: Number(form.members) || 0, pwd: Number(form.pwd) || 0,
      seniors: Number(form.seniors) || 0, children: Number(form.children) || 0,
      pregnant: Number(form.pregnant) || 0,
    };
    if (editId) {
      setHouseholds(households.map(h => h.id === editId ? { ...h, ...entry } : h));
    } else {
      setHouseholds([...households, { id: Date.now(), ...entry }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => setHouseholds(households.filter(h => h.id !== id));

  return (
    <div className="flex min-h-screen bg-white">
      <BarangaySidebar />

      <div className="ml-60 flex-1 p-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-6 gap-3 mb-7">
          {stats.map(({ label, value }) => (
            <Card key={label} className="!p-4">
              <div className="text-2xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: 'DM Sans' }}>{value}</div>
              <div className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>{label}</div>
            </Card>
          ))}
        </div>

        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[22px] font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Demographics</h1>
          <div className="flex gap-3">
            <Button variant="secondary" icon={<Upload size={16} />}>Upload Excel</Button>
            <Button variant="primary"   icon={<Plus size={16} />}   onClick={openAdd}>Add Household</Button>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="border-2 border-dashed border-[#CCCCCC] rounded-xl bg-white h-16 mb-5 flex items-center justify-center gap-4">
          <CloudUpload size={20} className="text-[#888888]" />
          <span className="text-sm text-[#888888]" style={{ fontFamily: 'DM Sans' }}>
            Drag &amp; drop .xlsx file or click to browse
          </span>
          <button className="text-[#FE9800] text-sm underline hover:text-[#C97700]" style={{ fontFamily: 'DM Sans' }}>
            Download template
          </button>
        </div>

        {/* Export */}
        <div className="flex justify-end mb-3">
          <Button variant="secondary" icon={<Upload size={16} />}>Export to Excel</Button>
        </div>

        {/* Table */}
        <Card className="!p-0 overflow-hidden">
          <table className="w-full">
            <thead style={{ backgroundColor: '#F5F5F5' }}>
              <tr>
                {COLS.map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase font-semibold"
                    style={{ fontFamily: 'DM Sans', color: '#888888' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {households.map((h, idx) => (
                <tr key={h.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#FAFAFA' }}>
                  <td className="px-4 py-3.5 text-sm font-medium text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>{h.head}</td>
                  <td className="px-4 py-3.5 text-sm text-[#555]"   style={{ fontFamily: 'DM Sans' }}>{h.address}</td>
                  <td className="px-4 py-3.5 text-sm text-[#333]"   style={{ fontFamily: 'DM Sans' }}>{h.members}</td>
                  <td className="px-4 py-3.5 text-sm text-[#333]"   style={{ fontFamily: 'DM Sans' }}>{h.pwd}</td>
                  <td className="px-4 py-3.5 text-sm text-[#333]"   style={{ fontFamily: 'DM Sans' }}>{h.seniors}</td>
                  <td className="px-4 py-3.5 text-sm text-[#333]"   style={{ fontFamily: 'DM Sans' }}>{h.children}</td>
                  <td className="px-4 py-3.5 text-sm text-[#333]"   style={{ fontFamily: 'DM Sans' }}>{h.pregnant}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(h)} className="text-[#888888] hover:text-[#FE9800] transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(h.id)} className="text-[#888888] hover:text-[#E74C3C] transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-[#F0F0F0] px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-[#888888]" style={{ fontFamily: 'DM Sans' }}>
              Showing 1–{households.length} of {households.length} households
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-[#CCCCCC] rounded text-sm hover:bg-[#F5F5F5]" style={{ fontFamily: 'DM Sans' }}>Previous</button>
              <button className="px-3 py-1 rounded text-sm text-white" style={{ backgroundColor: '#FE9800', fontFamily: 'DM Sans' }}>1</button>
              <button className="px-3 py-1 border border-[#CCCCCC] rounded text-sm hover:bg-[#F5F5F5]" style={{ fontFamily: 'DM Sans' }}>Next</button>
            </div>
          </div>
        </Card>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
              <h2 className="text-base font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
                {editId ? 'Edit Household' : 'Add Household'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#888888] hover:text-[#333] transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {[
                { label: 'Household Head', key: 'head',     type: 'text'   },
                { label: 'Address',        key: 'address',  type: 'text'   },
                { label: 'Members',        key: 'members',  type: 'number' },
                { label: 'PWD',            key: 'pwd',      type: 'number' },
                { label: 'Seniors',        key: 'seniors',  type: 'number' },
                { label: 'Children U5',    key: 'children', type: 'number' },
                { label: 'Pregnant',       key: 'pregnant', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-[#555] mb-1" style={{ fontFamily: 'DM Sans' }}>{label}</label>
                  <input type={type} value={form[key]} onChange={set(key)}
                    className="w-full px-3 py-2 text-sm bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg outline-none
                      focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/20 transition-all"
                    style={{ fontFamily: 'DM Sans' }} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-[#F0F0F0]">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-[#CCCCCC] text-[#555] hover:bg-[#F5F5F5] transition-colors"
                style={{ fontFamily: 'DM Sans' }}>Cancel</button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#FE9800] text-white hover:bg-[#e58a00] transition-colors"
                style={{ fontFamily: 'DM Sans' }}>
                {editId ? 'Save Changes' : 'Add Household'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
