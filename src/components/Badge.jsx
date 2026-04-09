const styles = {
    fresh:      'bg-[#E8FAF2] text-[#1A9E5C]',
    active:     'bg-[#E8FAF2] text-[#1A9E5C]',
    expiring:   'bg-[#FFF3DC] text-[#C97700]',
    warning:    'bg-[#FFF3DC] text-[#C97700]',
    expired:    'bg-[#FDECEA] text-[#E74C3C]',
    error:      'bg-[#FDECEA] text-[#E74C3C]',
    pending:    'bg-[#F0F0F0] text-[#444444]',
    'in-process': 'bg-[#EAF0FF] text-[#2255CC]',
    completed:  'bg-[#E8FAF2] text-[#1A9E5C]',
  };
  
  export default function Badge({ type, children, className = '' }) {
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[type] ?? ''} ${className}`}
        style={{ fontFamily: 'DM Sans', fontWeight: 600 }}
      >
        {children}
      </span>
    );
  }