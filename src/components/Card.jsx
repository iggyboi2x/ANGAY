export default function Card({ children, className = '' }) {
    return (
      <div
        className={`bg-white rounded-[16px] p-5 ${className}`}
        style={{ boxShadow: '0px 2px 12px rgba(0,0,0,0.06)' }}
      >
        {children}
      </div>
    );
  }