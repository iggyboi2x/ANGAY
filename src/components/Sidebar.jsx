import React, { useState } from 'react'
import { Menu, X, Grid, MessageCircle, Box, Package, Gift, Settings, LogOut } from 'lucide-react'

const items = [
  { label: 'Dashboard', icon: Grid },
  { label: 'Messages', icon: MessageCircle },
  { label: 'Inventory', icon: Box },
  { label: 'Packages', icon: Package },
  { label: 'Donations', icon: Gift },
  { label: 'Account Settings', icon: Settings },
  { label: 'Logout', icon: LogOut },
]

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed z-50 top-4 left-4 h-10 w-10 rounded-xl border border-gray-200 bg-white text-slate-700 shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FE9800] transition"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-orange-100 shadow-lg z-40 transition-[width,opacity] duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'
        }`}
        style={{ fontSize: '14px' }}
      >
        <div className="h-full flex flex-col justify-between p-4">
          <div className="space-y-1">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[#FE9800] text-xl font-bold">ANGAY</span>
            </div>
            {items.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] text-slate-700 hover:bg-orange-50 hover:text-[#FE9800] transition"
              >
                <Icon size={18} />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">Version 1.0</p>
        </div>
      </aside>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
        />
      )}
    </>
  )
}

export default Sidebar
