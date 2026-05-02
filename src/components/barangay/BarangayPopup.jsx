import { Users, Home, Activity, HeartPulse, Baby, User } from 'lucide-react';

export default function BarangayPopup({ pin, onClose }) {
  // Support both legacy static shape and live Supabase profile shape
  const name    = pin.org_name || pin.name  || 'Barangay';
  const address = pin.address  || pin.city  || '—';
  const contact = pin.contact  || '—';

  const hasDemographics = pin.demographics;

  return (
    <div className="bg-white rounded-xl shadow-xl w-60 p-4 relative">

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-[#AAAAAA] hover:text-[#1A1A1A] text-xs font-bold transition-colors"
      >
        ✕
      </button>

      {/* Header */}
      <div className="mb-2 pr-4">
        <p className="text-xs font-bold text-[#1A1A1A]">{name}</p>
        <p className="text-[11px] text-[#888888] leading-tight">{address}</p>
      </div>

      <hr className="border-[#F0F0F0] mb-2" />

      {hasDemographics ? (
        <>
          <p className="text-[9px] font-semibold text-[#AAAAAA] tracking-widest uppercase mb-1.5">
            Demographics
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              ['Members',    pin.demographics.population, Users, 'text-blue-500', 'bg-blue-50'],
              ['PWD',        pin.demographics.pwd, Activity, 'text-red-500', 'bg-red-50'],
              ['Seniors',    pin.demographics.seniors, User, 'text-orange-500', 'bg-orange-50'],
              ['Children',   pin.demographics.children, Baby, 'text-green-500', 'bg-green-50'],
              ['Pregnant',   pin.demographics.pregnant, HeartPulse, 'text-pink-500', 'bg-pink-50'],
            ].map(([label, value, Icon, colorClass, bgClass]) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg shrink-0 ${bgClass}`}>
                   <Icon size={12} className={colorClass} />
                </div>
                <div>
                  <p className="text-[10px] text-[#888888] leading-none mb-0.5">{label}</p>
                  <p className="text-xs font-bold text-[#1A1A1A] leading-none">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mb-3 space-y-1.5">
          <div>
            <p className="text-[9px] font-semibold text-[#AAAAAA] uppercase tracking-widest">Contact</p>
            <p className="text-xs font-bold text-[#1A1A1A]">{contact}</p>
          </div>
        </div>
      )}

      <button className="w-full py-1.5 bg-[#FE9800] hover:bg-[#e08800] text-white text-[10px] font-bold rounded-md transition-colors">
        Contact Barangay
      </button>
    </div>
  );
}
