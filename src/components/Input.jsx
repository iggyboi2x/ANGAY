import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({ label, error, className = '', ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = props.type === 'password';
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-[#444444]" style={{ fontFamily: 'DM Sans' }}>{label}</label>}
      <div className="relative">
        <input
          {...props}
          type={isPassword && showPassword ? 'text' : props.type}
          className={`w-full h-11 px-4 bg-[#F5F5F5] border border-[#CCCCCC] rounded-lg text-sm placeholder:text-[#888888] focus:outline-none focus:border-[#FE9800] focus:border-2 transition-colors ${className}`}
          style={{ fontFamily: 'DM Sans' }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#444444]">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-[#E74C3C]" style={{ fontFamily: 'DM Sans' }}>{error}</span>}
    </div>
  );
}