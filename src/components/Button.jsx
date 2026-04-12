const variants = {
    primary:     'bg-[#FE9800] text-white hover:bg-[#C97700] rounded-[10px]',
    secondary:   'bg-white border-[1.5px] border-black text-black hover:bg-[#F5F5F5] rounded-[10px]',
    ghost:       'text-[#FE9800] underline hover:text-[#C97700]',
    destructive: 'bg-[#E74C3C] text-white hover:bg-[#C0392B] rounded-[10px]',
  };
  
  export default function Button({ variant = 'primary', children, icon, className = '', ...props }) {
    return (
      <button
        className={`inline-flex items-center justify-center gap-2 px-5 h-11 transition-colors disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }