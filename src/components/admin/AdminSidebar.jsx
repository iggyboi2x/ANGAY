import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Users, 
  AlertOctagon, 
  History, 
  ClipboardList, 
  Radio, 
  LogOut, 
  Wheat,
  FileText
} from 'lucide-react';
import { supabase } from '../../../supabase';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Verification', icon: ShieldCheck, to: '/admin/verification' },
  { label: 'User Management', icon: Users, to: '/admin/users' },
  { label: 'Reports & Bans', icon: AlertOctagon, to: '/admin/reports' },
  { label: 'Global Ledger', icon: History, to: '/admin/logistics' },
  { label: 'Emergency SOS', icon: Radio, to: '/admin/emergency' },
  { label: 'Audit Logs', icon: ClipboardList, to: '/admin/logs' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-[#1A1A1A] h-screen flex flex-col fixed left-0 top-0 border-r border-white/5 z-50">
      {/* Logo */}
      <div className="h-20 px-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-10 h-10 bg-[#FE9800] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Wheat size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl text-white font-black tracking-tighter" style={{ fontFamily: 'Fredoka' }}>ANGAY</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Super Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 pt-6 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 h-12 rounded-xl transition-all relative group ${
                isActive 
                  ? 'bg-[#FE9800] text-white shadow-lg shadow-orange-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={20} className="shrink-0" />
            <span className="text-sm font-bold tracking-tight">
              {label}
            </span>
            {/* Active Indicator */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full hidden [.active_&]:block opacity-50" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 h-12 text-gray-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all w-full group"
        >
          <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="text-sm font-bold tracking-tight">System Logout</span>
        </button>
      </div>
    </div>
  );
}
