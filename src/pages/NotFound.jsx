import { Link } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
      <div className="max-w-md w-full space-y-8">
        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-[#1A1A1A] tracking-tighter">404</h1>
          <p className="text-2xl font-bold text-gray-400 uppercase tracking-widest">Seems like you got lost.</p>
        </div>

        {/* Mascot Image */}
        <div className="relative group">
          <div className="absolute inset-0 bg-[#FE9800]/5 rounded-[3rem] blur-3xl group-hover:bg-[#FE9800]/10 transition-all duration-700" />
          <img 
            src="/images/mascot.png" 
            alt="Angay Mascot" 
            className="relative w-80 h-auto mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Action Link */}
        <div className="pt-8">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#1A1A1A] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black hover:shadow-xl hover:shadow-black/10 transition-all active:scale-95"
          >
            <MoveLeft size={16} />
            Back to Safety
          </Link>
        </div>

        {/* Subtle Brand Watermark */}
        <p className="text-[10px] font-black text-gray-200 uppercase tracking-[0.3em] pt-12">
          ANGAY Humanitarian Network
        </p>
      </div>
    </div>
  );
}
