export default function BarangayPopup({ pin, onClose }) {
  // Support both legacy static shape and live Supabase profile shape
  const name    = pin.org_name || pin.name  || 'Barangay';
  const address = pin.address  || pin.city  || '—';
  const contact = pin.contact  || '—';

  const hasDemographics = pin.demographics;

  return (
    <div className="bg-white rounded-xl shadow-xl w-52 p-3 relative">

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
          <div className="grid grid-cols-2 gap-y-1.5 mb-3">
            {[
              ['Population', pin.demographics.population],
              ['Households', pin.demographics.households],
              ['PWD',        pin.demographics.pwd],
              ['Seniors',    pin.demographics.seniors],
              ['Children',   pin.demographics.children],
              ['Pregnant',   pin.demographics.pregnant],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] text-[#888888]">{label}</p>
                <p className="text-xs font-bold text-[#1A1A1A]">{value}</p>
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
