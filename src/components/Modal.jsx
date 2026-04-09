import { X } from 'lucide-react';

const widthClasses = { sm: 'max-w-[400px]', md: 'max-w-[480px]', lg: 'max-w-[640px]', xl: 'max-w-[800px]' };

export default function Modal({ isOpen, onClose, title, children, className = '', width = 'md' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className={`bg-white rounded-[20px] p-8 w-full ${widthClasses[width]} ${className}`}
        style={{ boxShadow: '0px 16px 48px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'DM Sans' }}>{title}</h2>
          <button onClick={onClose} className="text-[#888888] hover:text-black transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="border-t border-[#F0F0F0] mb-6" />
        {children}
      </div>
    </div>
  );
}