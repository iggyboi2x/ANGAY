import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Package, Box, Gift, Settings, LogOut, Wheat, X } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/foodbank/dashboard' },
  { label: 'Messages',  icon: MessageSquare,   to: '/foodbank/messages'  },
  { label: 'Inventory', icon: Package,          to: '/foodbank/inventory' },
  { label: 'Packages',  icon: Box,              to: '/foodbank/packages'  },
  { label: 'Donations', icon: Gift,             to: '/foodbank/donations' },
];

export default function FoodbankSidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden" 
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}
      <div className={`w-60 bg-white h-screen flex flex-col fixed left-0 top-0 border-r border-[#F0F0F0] z-50 transition-transform transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Logo */}
        <div className="h-16 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wheat size={20} className="text-[#FE9800]" />
            <h1 className="text-[24px] text-[#FE9800]" style={{ fontFamily: 'Fredoka', fontWeight: 700 }}>ANGAY</h1>
          </div>
          {mobileOpen && setMobileOpen && (
            <button className="md:hidden text-[#888888] hover:bg-gray-100 p-1 rounded-md" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          )}
        </div>

      {/* Nav */}
      <nav className="flex-1 px-4 pt-2">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 h-12 rounded-lg transition-colors relative mb-1 ${
                isActive ? 'bg-[#FFF3DC] text-[#FE9800]' : 'text-[#444444] hover:bg-[#F8F8F8]'
              }`
            }
          >
            {/* FIX: use CSS class on the indicator instead of render prop */}
            <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#FE9800] rounded-r hidden [.active_&]:block" />
            <Icon size={18} />
            <span className="text-[14px]" style={{ fontFamily: 'DM Sans', fontWeight: 500 }}>
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#F0F0F0] px-4 py-4">
        <NavLink
          to="/account/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 h-12 rounded-lg transition-colors relative mb-1 ${
              isActive ? 'bg-[#FFF3DC] text-[#FE9800]' : 'text-[#444444] hover:bg-[#F8F8F8]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FE9800] rounded-r" />}
              <Settings size={18} className={isActive ? 'text-[#FE9800]' : 'text-[#888888]'} />
              <span className="text-[14px]" style={{ fontFamily: 'DM Sans', fontWeight: isActive ? 600 : 500 }}>
                Account Settings
              </span>
            </>
          )}
        </NavLink>
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-3 px-4 h-12 text-[#444444] hover:bg-red-50 hover:text-[#E74C3C] rounded-lg transition-colors w-full"
        >
          <LogOut size={18} className="text-[#888888]" />
          <span className="text-[14px]" style={{ fontFamily: 'DM Sans', fontWeight: 500 }}>Logout</span>
        </button>
      </div>
      </div>
    </>
  );
}