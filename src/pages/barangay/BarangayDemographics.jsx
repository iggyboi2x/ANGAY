import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../../supabase';
import { useProfile } from '../../hooks/useProfile';
import BarangaySidebar from '../../components/barangay/BarangaySidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FlashMessage from '../../components/FlashMessage';
import Modal from '../../components/Modal';
import { 
  Users, UserCheck, Baby, Heart, CloudUpload, Upload, 
  Plus, Pencil, Trash2, X, Check, AlertCircle, 
  ChevronLeft, ChevronRight, Save, Trash
} from 'lucide-react';

const REQUIRED_COLS = ['Household Head', 'Address', 'Members', 'PWD', 'Seniors', 'Children', 'Pregnant'];
const PAGE_SIZE = 10;

const emptyForm = { 
  household_head: '', 
  address: '', 
  member_count: 0, 
  pwd_count: 0, 
  senior_count: 0, 
  children_count: 0, 
  pregnant_count: 0 
};

export default function BarangayDemographics() {
  const { id: barangayId, loading: profileLoading } = useProfile();
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Stats
  const [stats, setStats] = useState({
    totalHH: 0,
    totalPop: 0,
    pwd: 0,
    seniors: 0,
    children: 0,
    pregnant: 0
  });

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  // Flash Message
  const [flash, setFlash] = useState(null);

  // Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Upload / Mapping state
  const [importData, setImportData] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (barangayId) {
      fetchHouseholds();
      fetchStats();
    }
  }, [barangayId, currentPage]);

  const fetchHouseholds = async () => {
    setLoading(true);
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    try {
      const { data, count, error } = await supabase
        .from('demographics')
        .select('*', { count: 'exact' })
        .eq('barangay_id', barangayId)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;
      setHouseholds(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching demographics:', err);
      setFlash({ message: 'Failed to fetch households.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('demographics')
        .select('member_count, pwd_count, senior_count, children_count, pregnant_count')
        .eq('barangay_id', barangayId);

      if (error) throw error;

      const totals = data.reduce((acc, h) => ({
        hh: acc.hh + 1,
        pop: acc.pop + (h.member_count || 0),
        pwd: acc.pwd + (h.pwd_count || 0),
        seniors: acc.seniors + (h.senior_count || 0),
        children: acc.children + (h.children_count || 0),
        pregnant: acc.pregnant + (h.pregnant_count || 0),
      }), { hh: 0, pop: 0, pwd: 0, seniors: 0, children: 0, pregnant: 0 });

      setStats({
        totalHH: totals.hh,
        totalPop: totals.pop,
        pwd: totals.pwd,
        seniors: totals.seniors,
        children: totals.children,
        pregnant: totals.pregnant
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (data.length === 0) {
        setFlash({ message: 'The file is empty.', type: 'error' });
        return;
      }

      const headers = data[0].map(h => String(h).trim());
      const mapping = headers.reduce((acc, h) => {
        const match = REQUIRED_COLS.find(rc => rc.toLowerCase() === h.toLowerCase());
        if (match) acc[match] = h;
        return acc;
      }, {});

      const rows = data.slice(1).map((r, i) => {
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = r[idx];
        });
        return { ...rowObj, __id: i };
      });

      const missingCols = REQUIRED_COLS.filter(col => !mapping[col]);
      
      // Check for errors in rows
      const hasErrors = rows.some(r => {
        if (!String(r[mapping['Household Head']] || '').trim()) return true;
        if (!String(r[mapping['Address']] || '').trim()) return true;
        const numCols = ['Members', 'PWD', 'Seniors', 'Children', 'Pregnant'];
        return numCols.some(col => isNaN(Number(r[mapping[col]])) || r[mapping[col]] === undefined || r[mapping[col]] === '');
      });

      if (missingCols.length > 0 || hasErrors) {
        setImportData({
          headers,
          rows,
          missingCols,
          mapping
        });
      } else {
        processImport(rows, mapping);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  const processImport = async (rows, mapping) => {
    if (!barangayId) {
      setFlash({ message: 'User session not loaded. Please try again.', type: 'error' });
      return;
    }
    console.log('[DEBUG] Importing for Barangay ID:', barangayId);
    setLoading(true);
    const toInsertRaw = rows.map(r => ({
      barangay_id: barangayId,
      household_head: String(r[mapping['Household Head']] || '').trim(),
      address: String(r[mapping['Address']] || '').trim(),
      member_count: r[mapping['Members']],
      pwd_count: r[mapping['PWD']],
      senior_count: r[mapping['Seniors']],
      children_count: r[mapping['Children']],
      pregnant_count: r[mapping['Pregnant']],
    }));

    // Final Validation Check
    const nameRegex = /^[A-Za-z\s.'-]+$/;
    const firstErrorIdx = toInsertRaw.findIndex(r => {
      if (!r.household_head || !nameRegex.test(r.household_head)) return true;
      if (!r.address) return true;
      const numCols = ['member_count', 'pwd_count', 'senior_count', 'children_count', 'pregnant_count'];
      return numCols.some(col => {
        const val = Number(r[col]);
        return r[col] === undefined || r[col] === '' || isNaN(val) || val < 0;
      });
    });

    if (firstErrorIdx !== -1) {
      setFlash({ 
        message: `Validation failed: Row ${firstErrorIdx + 1} contains errors. Please fix all highlighted cells.`, 
        type: 'error' 
      });
      setLoading(false);
      return;
    }

    const filtered = toInsertRaw.map(r => ({
      ...r,
      member_count: Number(r.member_count) || 0,
      pwd_count: Number(r.pwd_count) || 0,
      senior_count: Number(r.senior_count) || 0,
      children_count: Number(r.children_count) || 0,
      pregnant_count: Number(r.pregnant_count) || 0,
    }));

    // Deduplicate: PostgreSQL upsert fails if the same batch contains duplicate keys
    const seen = new Set();
    const toInsert = filtered.filter(item => {
      const key = `${item.barangay_id}-${item.household_head}-${item.address}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    try {
      // Supabase UNIQUE constraint (barangay_id, household_head, address) will handle duplicates
      // if we use upsert or just catch error. The user said: "what was previously saved should be kept and new ones will be added"
      // This implies we should just try to insert and ignore duplicates or use upsert.
      // Schema has UNIQUE(barangay_id, household_head, address).
      
      const { error } = await supabase
        .from('demographics')
        .upsert(toInsert, { onConflict: 'barangay_id, household_head, address' });

      if (error) throw error;

      setFlash({ message: 'Demographics imported successfully!', type: 'success' });
      setImportData(null);
      fetchHouseholds();
      fetchStats();
    } catch (err) {
      console.error('Import error:', err);
      setFlash({ message: 'Failed to import data: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!barangayId) {
      setFlash({ message: 'User session not loaded. Please try again.', type: 'error' });
      return;
    }
    const nameRegex = /^[A-Za-z\s.'-]+$/;
    if (!form.household_head.trim() || !nameRegex.test(form.household_head)) {
      setFlash({ message: 'Household Head must contain letters only.', type: 'error' });
      return;
    }
    
    const numCols = ['member_count', 'pwd_count', 'senior_count', 'children_count', 'pregnant_count'];
    for (const col of numCols) {
      if (Number(form[col]) < 0) {
        setFlash({ message: 'Demographic counts cannot be negative.', type: 'error' });
        return;
      }
    }

    if (!form.household_head.trim()) return;
    setIsSaving(true);
    
    const payload = {
      ...form,
      barangay_id: barangayId,
      member_count: Number(form.member_count) || 0,
      pwd_count: Number(form.pwd_count) || 0,
      senior_count: Number(form.senior_count) || 0,
      children_count: Number(form.children_count) || 0,
      pregnant_count: Number(form.pregnant_count) || 0,
    };

    try {
      let error;
      if (editId) {
        const { error: err } = await supabase
          .from('demographics')
          .update(payload)
          .eq('id', editId);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('demographics')
          .insert([payload]);
        error = err;
      }

      if (error) throw error;

      setFlash({ 
        message: `Household ${editId ? 'updated' : 'added'} successfully!`, 
        type: 'success' 
      });
      setShowModal(false);
      fetchHouseholds();
      fetchStats();
    } catch (err) {
      console.error('Save error:', err);
      setFlash({ message: 'Error saving household: ' + err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const { error } = await supabase
        .from('demographics')
        .delete()
        .eq('id', deleteConfirm);
      
      if (error) throw error;
      
      setFlash({ message: 'Household deleted successfully!', type: 'success' });
      fetchHouseholds();
      fetchStats();
    } catch (err) {
      setFlash({ message: 'Error deleting household.', type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (h) => {
    setForm({
      household_head: h.household_head,
      address: h.address,
      member_count: h.member_count,
      pwd_count: h.pwd_count,
      senior_count: h.senior_count,
      children_count: h.children_count,
      pregnant_count: h.pregnant_count
    });
    setEditId(h.id);
    setShowModal(true);
  };

  const updateImportRow = (idx, field, value) => {
    setImportData(prev => ({
      ...prev,
      rows: prev.rows.map((r, i) => i === idx ? { ...r, [field]: value } : r)
    }));
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Household Head': 'Juan Dela Cruz',
        'Address': '123 Main St, Brgy. Central',
        'Members': 5,
        'PWD': 0,
        'Seniors': 1,
        'Children': 2,
        'Pregnant': 'No'
      },
      {
        'Household Head': 'Maria Santos',
        'Address': '456 Oak Ave, Brgy. Central',
        'Members': 4,
        'PWD': 1,
        'Seniors': 0,
        'Children': 1,
        'Pregnant': 'Yes'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Demographics');
    XLSX.writeFile(wb, 'barangay_demographics_template.xlsx');
  };

  // Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!resetPassword) return;
    setIsResetting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: resetPassword
      });

      if (authError) throw new Error('Incorrect password. Please try again.');

      const { error: deleteError } = await supabase
        .from('demographics')
        .delete()
        .eq('barangay_id', barangayId);

      if (deleteError) throw deleteError;

      setFlash({ message: 'All demographics have been cleared.', type: 'success' });
      setShowResetModal(false);
      setResetPassword('');
      fetchHouseholds();
      fetchStats();
    } catch (err) {
      setFlash({ message: err.message, type: 'error' });
    } finally {
      setIsResetting(false);
    }
  };

  const statCards = [
    { label: 'Total HH', value: stats.totalHH, icon: Users },
    { label: 'Population', value: stats.totalPop, icon: Users },
    { label: 'PWD', value: stats.pwd, icon: UserCheck },
    { label: 'Seniors', value: stats.seniors, icon: Users },
    { label: 'Children U5', value: stats.children, icon: Baby },
    { label: 'Pregnant', value: stats.pregnant, icon: Heart },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      <BarangaySidebar />

      <div className="ml-60 flex-1 p-8">
        {flash && <FlashMessage message={flash.message} type={flash.type} onClose={() => setFlash(null)} />}

        {/* Summary Stats */}
        <div className="grid grid-cols-6 gap-3 mb-7">
          {statCards.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="!p-4 border border-[#F0F0F0] hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-1">
                <div className="text-2xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>{value}</div>
                <Icon size={16} className="text-[#FE9800]" />
              </div>
              <div className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>{label}</div>
            </Card>
          ))}
        </div>

        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[22px] font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Demographics</h1>
          <div className="flex gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
            />
            <Button 
              variant="secondary" 
              icon={<Upload size={16} />} 
              onClick={() => fileInputRef.current.click()}
              disabled={profileLoading}
            >
              Upload Excel
            </Button>
            <button 
              onClick={downloadTemplate}
              disabled={profileLoading}
              className="text-[#FE9800] text-sm font-semibold hover:underline px-2 disabled:opacity-50"
              style={{ fontFamily: 'DM Sans' }}
            >
              Download Template
            </button>
            <Button 
              variant="primary" 
              icon={<Plus size={16} />} 
              onClick={openAdd}
              disabled={profileLoading}
            >
              Add Household
            </Button>
            <Button 
              variant="secondary" 
              className="!border-red-200 !text-red-500 hover:!bg-red-50"
              icon={<Trash2 size={16} />} 
              onClick={() => setShowResetModal(true)}
              disabled={profileLoading}
            >
              Reset Data
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="!p-0 overflow-hidden border border-[#F0F0F0]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: '#F9FAFB' }}>
                <tr className="border-b border-[#F0F0F0]">
                  {['Household Head', 'Address', 'Members', 'PWD', 'Seniors', 'Children', 'Pregnant', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs uppercase font-bold tracking-wider"
                      style={{ fontFamily: 'DM Sans', color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {loading ? (
                  <tr><td colSpan="8" className="py-10 text-center text-sm text-gray-500">Loading data...</td></tr>
                ) : households.length === 0 ? (
                  <tr><td colSpan="8" className="py-10 text-center text-sm text-gray-500">No demographics found.</td></tr>
                ) : households.map((h, idx) => (
                  <tr key={h.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-4 py-4 text-sm font-semibold text-[#111827]" style={{ fontFamily: 'DM Sans' }}>{h.household_head}</td>
                    <td className="px-4 py-4 text-sm text-[#4B5563]" style={{ fontFamily: 'DM Sans' }}>{h.address}</td>
                    <td className="px-4 py-4 text-sm text-[#4B5563]" style={{ fontFamily: 'DM Sans' }}>{h.member_count}</td>
                    <td className="px-4 py-4 text-sm text-[#4B5563]" style={{ fontFamily: 'DM Sans' }}>{h.pwd_count}</td>
                    <td className="px-4 py-4 text-sm text-[#4B5563]" style={{ fontFamily: 'DM Sans' }}>{h.senior_count}</td>
                    <td className="px-4 py-4 text-sm text-[#4B5563]" style={{ fontFamily: 'DM Sans' }}>{h.children_count}</td>
                    <td className="px-4 py-4 text-sm text-[#4B5563]" style={{ fontFamily: 'DM Sans' }}>{h.pregnant_count}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(h)} className="text-gray-400 hover:text-[#FE9800] transition-colors">
                          <Pencil size={17} />
                        </button>
                        <button onClick={() => setDeleteConfirm(h.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="border-t border-[#F0F0F0] px-6 py-4 flex items-center justify-between bg-white">
            <span className="text-sm text-gray-500" style={{ fontFamily: 'DM Sans' }}>
              Showing <span className="font-medium">{(currentPage-1)*PAGE_SIZE + 1}</span> to <span className="font-medium">{Math.min(currentPage*PAGE_SIZE, totalCount)}</span> of <span className="font-medium">{totalCount}</span> households
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                disabled={currentPage * PAGE_SIZE >= totalCount}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Editable Import Dashboard */}
      {importData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Review & Edit Uploaded Data</h2>
                <p className="text-sm text-gray-500 mt-0.5">Please ensure all columns are mapped correctly and fix any errors below.</p>
              </div>
              <button onClick={() => setImportData(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-gray-50/50">
              {importData.missingCols.length > 0 && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h3 className="text-sm font-bold text-orange-800">Missing Required Columns</h3>
                    <p className="text-xs text-orange-700/80 mt-1">
                      The following columns were not found: {importData.missingCols.join(', ')}. 
                      You can manually map them or edit the data in the grid below.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-700 w-12">#</th>
                      {REQUIRED_COLS.map(col => (
                        <th key={col} className="px-4 py-3 text-left font-bold text-gray-700">
                          <div className="flex items-center gap-1.5">
                            {col}
                            <span className="text-red-500 text-xs">*</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importData.rows.slice(0, 100).map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-2 text-gray-400 font-medium">{idx + 1}</td>
                        {REQUIRED_COLS.map(col => {
                          const mappedHeader = importData.mapping[col];
                          const val = row[mappedHeader] ?? '';
                          
                          // Validation
                          let isInvalid = false;
                          const nameRegex = /^[A-Za-z\s.'-]+$/;
                          if (col === 'Household Head') {
                            isInvalid = !String(val).trim() || !nameRegex.test(val);
                          } else if (col === 'Address') {
                            isInvalid = !String(val).trim();
                          } else {
                            const numVal = Number(val);
                            isInvalid = val === '' || isNaN(numVal) || numVal < 0;
                          }

                          return (
                            <td key={col} className="px-2 py-2">
                              <input 
                                type={['Members', 'PWD', 'Seniors', 'Children', 'Pregnant'].includes(col) ? 'number' : 'text'}
                                value={val}
                                onChange={(e) => updateImportRow(idx, mappedHeader || col, e.target.value)}
                                className={`w-full px-2 py-1.5 border rounded transition-all outline-none text-xs
                                  ${isInvalid 
                                    ? 'bg-red-50 border-red-200 text-red-900 placeholder-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-100' 
                                    : 'border-transparent hover:border-gray-200 focus:border-[#FE9800] focus:bg-white bg-transparent'
                                  }`}
                                placeholder={isInvalid ? 'Required' : ''}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importData.rows.length > 100 && (
                  <div className="p-3 text-center text-xs text-gray-500 bg-gray-50 italic">
                    Showing first 100 rows of {importData.rows.length}...
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <Button variant="secondary" onClick={() => setImportData(null)}>Cancel</Button>
              <Button variant="primary" icon={<Save size={16} />} onClick={() => processImport(importData.rows, importData.mapping)}>
                Import {importData.rows.length} Households
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'DM Sans' }}>
                {editId ? 'Edit Household' : 'Add Household'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Household Head</label>
                <input 
                  type="text" 
                  value={form.household_head} 
                  onChange={e => setForm({...form, household_head: e.target.value})}
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/10 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
                <input 
                  type="text" 
                  value={form.address} 
                  onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="Street, Barangay, City"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/10 transition-all text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Total Members</label>
                  <input 
                    type="number" 
                    value={form.member_count} 
                    onChange={e => setForm({...form, member_count: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/10 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">PWDs</label>
                  <input 
                    type="number" 
                    value={form.pwd_count} 
                    onChange={e => setForm({...form, pwd_count: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/10 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Seniors</label>
                  <input 
                    type="number" 
                    value={form.senior_count} 
                    onChange={e => setForm({...form, senior_count: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/10 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Children U5</label>
                  <input 
                    type="number" 
                    value={form.children_count} 
                    onChange={e => setForm({...form, children_count: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/10 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Pregnant</label>
                  <input 
                    type="number" 
                    value={form.pregnant_count} 
                    onChange={e => setForm({...form, pregnant_count: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/10 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-5 border-t border-gray-100 bg-gray-50/50">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#FE9800] text-white hover:bg-[#e58a00] shadow-lg shadow-orange-200 active:scale-95 disabled:opacity-50 transition-all"
              >
                {isSaving ? 'Saving...' : (editId ? 'Save Changes' : 'Add Household')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash size={24} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Delete Household?</h2>
            <p className="text-sm text-gray-500 mt-2">
              Are you sure you want to delete this household? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-100 active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Reset All Data?</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              This will permanently delete all demographic records for your barangay. 
              Please enter your password to confirm.
            </p>
            
            <div className="mt-5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Your Password</label>
              <input 
                type="password" 
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-sm"
              />
            </div>

            <div className="flex gap-3 mt-7">
              <button 
                onClick={() => { setShowResetModal(false); setResetPassword(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleReset}
                disabled={isResetting || !resetPassword}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100 active:scale-95 disabled:opacity-50 transition-all"
              >
                {isResetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
