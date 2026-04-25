import React from 'react'
import Sidebar from '../components/Sidebar'
import { Bell, UserCircle2 } from 'lucide-react'

const stats = [
  { label: 'Total Items', value: '500' },
  { label: 'Nearing Expiry', value: '3', badge: 'Action Needed' },
  { label: 'Distributed This Month', value: '24' },
  { label: 'Pending Pickups', value: '7' },
]

const incomingDonations = [
  { item: 'Rice 50kg', donor: 'John Doe', date: 'Mar 20, 2026', status: 'Confirmed' },
  { item: 'Canned Goods', donor: 'Maria Santos', date: 'Mar 18, 2026', status: 'Pending' },
  { item: 'Fresh Vegetables', donor: 'Barangay Lahug', date: 'Mar 17, 2026', status: 'Confirmed' },
]

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-800">
      <Sidebar />

      <div className="ml-0 md:ml-64 transition-all duration-300">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <h1 className="text-xl font-bold" style={{ fontSize: '14px' }}>Dashboard</h1>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg text-slate-600 hover:bg-orange-50 hover:text-[#FE9800] transition" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1">
              <UserCircle2 size={20} className="text-[#FE9800]" />
              <span className="font-semibold" style={{ fontSize: '14px' }}>Cebu City Food Bank</span>
            </div>
          </div>
        </header>

        <main className="px-6 py-6">
          <div className="grid gap-4 md:grid-cols-4 mb-5">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold" style={{ fontSize: '14px' }}>{stat.value}</h2>
                  <span className="text-slate-400 text-xs">{stat.label}</span>
                </div>
                {stat.badge && (
                  <span className="mt-3 inline-block rounded-full bg-orange-100 text-orange-800 px-2 py-1 text-xs font-semibold">{stat.badge}</span>
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="lg:col-span-2 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ fontSize: '14px' }}>Barangay Map</h3>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">5 barangays</span>
              </div>
              <div className="h-64 rounded-xl bg-blue-100 flex items-center justify-center text-slate-400" style={{ fontSize: '14px' }}>
                Map placeholder
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-3" style={{ fontSize: '14px' }}>March 2026</h3>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="py-1 font-semibold">{d}</div>
                ))}

                {[...Array(31)].map((_, idx) => {
                  const day = idx + 1
                  const active = day === 17
                  return (
                    <div key={day} className={`py-2 rounded-full ${active ? 'bg-[#FE9800] text-white' : 'text-slate-600'}`} style={{ fontSize: '14px' }}>
                      {day}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-3" style={{ fontSize: '14px' }}>Incoming Donations</h3>
            <div className="space-y-3">
              {incomingDonations.map((donation) => (
                <div key={donation.item} className="rounded-xl border border-gray-200 p-3">
                  <h4 className="font-semibold" style={{ fontSize: '14px' }}>{donation.item}</h4>
                  <p className="text-xs text-slate-500">{donation.donor}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{donation.date}</span>
                    <span className={`rounded-full px-2 py-1 text-xs ${donation.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{donation.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
