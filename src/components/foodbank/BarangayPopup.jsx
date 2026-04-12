export default function BarangayPopup({ pin, onClose }) {
  const rows = [
    { label: 'Population', value: pin.demographics.population },
    { label: 'Households', value: pin.demographics.households },
    { label: 'PWD',        value: pin.demographics.pwd        },
    { label: 'Seniors',    value: pin.demographics.seniors    },
    { label: 'Children',   value: pin.demographics.children   },
    { label: 'Pregnant',   value: pin.demographics.pregnant   },
  ];

  return (
    <div className="bg-white rounded-xl shadow-xl w-44 p-3 relative">

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-[#AAAAAA] hover:text-[#1A1A1A] text-xs font-bold transition-colors"
      >
        ✕
      </button>

      {/* Header */}
      <div className="mb-2 pr-4">
        <p className="text-xs font-bold text-[#1A1A1A]">{pin.name}</p>
        <p className="text-[11px] text-[#888888]">{pin.city}</p>
      </div>

      <hr className="border-[#F0F0F0] mb-2" />

      {/* Demographics Label */}
      <p className="text-[9px] font-semibold text-[#AAAAAA] tracking-widest uppercase mb-1.5">
        Demographics
      </p>

      {/* Demographics Grid */}
      <div className="grid grid-cols-2 gap-y-1.5 mb-3">
        {rows.map(({ label, value }) => (
          <div key={label}>
            <p className="text-[10px] text-[#888888]">{label}</p>
            <p className="text-xs font-bold text-[#1A1A1A]">{value}</p>
          </div>
        ))}
      </div>

      {/* Button */}
      <button className="w-full py-1.5 bg-[#FE9800] hover:bg-[#e08800] text-white text-[10px] font-bold rounded-md transition-colors">
        Send Donation Proposal
      </button>

    </div>
  );
}