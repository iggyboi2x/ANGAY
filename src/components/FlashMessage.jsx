import { useEffect } from "react";
import { CircleX, CheckCircle2, X } from "lucide-react";

export default function FlashMessage({ message, type = "error", onClose, duration = 3200 }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isError = type === "error";

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md">
      <div
        className={`rounded-xl shadow-lg border px-4 py-3 flex items-start gap-2.5 ${
          isError
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-emerald-50 border-emerald-200 text-emerald-700"
        }`}
      >
        <div className="pt-0.5">
          {isError ? <CircleX size={18} /> : <CheckCircle2 size={18} />}
        </div>
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-current/70 hover:text-current transition-colors"
          aria-label="Close message"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
