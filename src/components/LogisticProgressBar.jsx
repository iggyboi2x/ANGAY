import React from 'react';
import { User, Building2, MapPin, CheckCircle2, Image as ImageIcon, Camera } from 'lucide-react';

export default function LogisticProgressBar({ status, steps = [], onShowProof }) {
  // status can be: 'pending_fb', 'at_fb', 'at_barangay', 'distributed'
  
  const STAGES = [
    { key: 'donor', label: 'Donor', icon: <User size={16} /> },
    { key: 'foodbank', label: 'Foodbank', icon: <Building2 size={16} /> },
    { key: 'barangay', label: 'Barangay', icon: <MapPin size={16} /> },
    { key: 'distributed', label: 'Distributed', icon: <CheckCircle2 size={16} /> },
  ];

  const getStageStatus = (index) => {
    // 0: Donor (Always done if request exists)
    // 1: Foodbank (Done if donation status is 'completed' or distribution exists)
    // 2: Barangay (Done if distribution status is 'received' or 'distributed')
    // 3: Distributed (Done if distribution status is 'distributed')
    
    if (status === 'distributed') return 'completed';
    
    if (index === 0) return 'completed';
    if (index === 1 && (status === 'at_fb' || status === 'at_barangay')) return 'completed';
    if (index === 2 && status === 'at_barangay') return 'completed';
    if (index === 3 && status === 'distributed') return 'completed';
    
    // Current active stage
    if (index === 1 && status === 'pending_fb') return 'active';
    if (index === 2 && status === 'at_fb') return 'active';
    if (index === 3 && status === 'at_barangay') return 'active';

    return 'pending';
  };

  return (
    <div className="flex items-center w-full px-2 py-6">
      {STAGES.map((stage, idx) => {
        const stageStatus = getStageStatus(idx);
        const isLast = idx === STAGES.length - 1;

        return (
          <React.Fragment key={stage.key}>
            <div className="relative flex flex-col items-center group">
              {/* Icon Circle */}
              <div 
                onClick={() => idx === 3 && stageStatus === 'completed' && onShowProof && onShowProof()}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 z-10 border-2 ${
                  stageStatus === 'completed' 
                    ? 'bg-[#FE9800] border-[#FE9800] text-white shadow-lg' 
                    : stageStatus === 'active'
                    ? 'bg-white border-[#FE9800] text-[#FE9800] shadow-md animate-pulse'
                    : 'bg-white border-gray-200 text-gray-300'
                } ${idx === 3 && stageStatus === 'completed' ? 'cursor-pointer hover:scale-110' : ''}`}
              >
                {stageStatus === 'completed' ? <CheckCircle2 size={18} /> : stage.icon}
              </div>

              {/* Stage Label */}
              <div className="absolute -bottom-6 w-max">
                <span className={`text-[10px] font-black uppercase tracking-tighter ${
                  stageStatus === 'completed' ? 'text-[#FE9800]' : 'text-gray-400'
                }`}>
                  {stage.label}
                </span>
              </div>

              {/* Hover Badge (Only for Distributed with Proof) */}
              {idx === 3 && stageStatus === 'completed' && onShowProof && (
                <div className="absolute -top-9 right-[-10px] invisible group-hover:visible group-hover:-top-11 transition-all duration-300 z-50">
                  <div className="bg-[#1A1A1A] text-white text-[9px] px-3 py-1.5 rounded-lg shadow-2xl whitespace-nowrap font-black uppercase tracking-widest border border-white/10 flex items-center gap-2">
                    <ImageIcon size={10} className="text-[#FE9800]" />
                    View Proof
                  </div>
                  {/* Arrow anchored to the circle */}
                  <div className="w-1.5 h-1.5 bg-[#1A1A1A] rotate-45 absolute -bottom-0.5 right-[18px] border-r border-b border-white/10" />
                </div>
              )}
            </div>

            {/* Connecting Line */}
            {!isLast && (
              <div className="flex-1 h-0.5 bg-gray-100 mx-1 relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-[#FE9800] transition-all duration-700 ease-in-out"
                  style={{ width: stageStatus === 'completed' ? '100%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
