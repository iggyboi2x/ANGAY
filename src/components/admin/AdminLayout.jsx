import { useState, useRef, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { FileDown, Download, Upload, FileText, ChevronDown, Bell, Search, User } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import * as XLSX from 'xlsx';

export default function AdminLayout({ children, title = "System Overview" }) {
  const { displayName, avatarUrl, initials } = useProfile();
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const fileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target)) {
        setFileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportInventory = () => {
    // Placeholder for actual data fetching
    const dummyData = [
      { item: 'Rice', quantity: 500, unit: 'kg', category: 'Food' },
      { item: 'Canned Goods', quantity: 1200, unit: 'cans', category: 'Food' },
    ];
    const ws = XLSX.utils.json_to_sheet(dummyData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, "ANGAY_Inventory_Export.xlsx");
    setFileMenuOpen(false);
  };

  const handleDownloadTemplate = () => {
    const template = [
      { 'Account Name': '', 'Role': '', 'Email': '', 'Status': '' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "ANGAY_Bulk_Upload_Template.xlsx");
    setFileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <AdminSidebar />
      
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40">
          <div>
            <h2 className="text-xl font-black text-[#1A1A1A] uppercase tracking-tight">{title}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Control Panel / Main Node</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Bar */}
            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FE9800] transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search ledger, users, logs..."
                className="w-72 h-11 pl-11 pr-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-medium focus:outline-none focus:bg-white focus:border-[#FE9800] transition-all"
              />
            </div>

            {/* File Operations Dropdown */}
            <div className="relative" ref={fileMenuRef}>
              <button 
                onClick={() => setFileMenuOpen(!fileMenuOpen)}
                className="flex items-center gap-2 px-4 h-11 bg-[#1A1A1A] text-white rounded-2xl hover:bg-black transition-all shadow-lg shadow-black/5"
              >
                <FileText size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Operations</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${fileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {fileMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-gray-50 p-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="px-4 py-2 mb-2 border-b border-gray-50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System File Tasks</p>
                  </div>
                  <button 
                    onClick={handleExportInventory}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50 text-gray-700 hover:text-[#FE9800] rounded-2xl transition-all group"
                  >
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-white">
                      <FileDown size={16} />
                    </div>
                    <span className="text-xs font-bold">Export Inventory</span>
                  </button>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-2xl transition-all group"
                  >
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-white">
                      <Download size={16} />
                    </div>
                    <span className="text-xs font-bold">Download Template</span>
                  </button>
                  <div className="relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        console.log('File uploaded:', e.target.files[0]);
                        setFileMenuOpen(false);
                      }}
                    />
                    <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 text-gray-700 hover:text-green-600 rounded-2xl transition-all group">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-white">
                        <Upload size={16} />
                      </div>
                      <span className="text-xs font-bold">Upload Excel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-8 bg-gray-100" />

            {/* Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-[#1A1A1A] uppercase tracking-tighter leading-none">{displayName || 'Admin'}</p>
                <p className="text-[9px] text-[#FE9800] font-black uppercase tracking-widest mt-1">Super User</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-gray-400">{initials || 'A'}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
