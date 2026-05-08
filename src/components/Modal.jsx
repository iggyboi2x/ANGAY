import { X } from 'lucide-react';

const widthClasses = { sm: 'max-w-[400px]', md: 'max-w-[480px]', lg: 'max-w-[640px]', xl: 'max-w-[800px]' };

export default function Modal({ isOpen, onClose, title, children, className = '', width = 'md' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[99999] grid place-items-center bg-black/50 p-4 overflow-y-auto" onClick={onClose}>
      <div
        className={`bg-white rounded-[2.5rem] w-full ${widthClasses[width]} ${className} my-auto flex flex-col overflow-hidden relative shadow-2xl`}
        style={{ boxShadow: '0px 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-10 pt-8 pb-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>{title}</h2>
          <button onClick={onClose} className="p-2.5 rounded-2xl text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100 transition-all">
            <X size={24} />
          </button>
        </div>
        <div className="px-10 pb-10 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}