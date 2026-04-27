import Modal from './Modal';
import Button from './Button';
import { AlertCircle } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger" // danger or primary
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="sm">
      <div className="flex flex-col items-center text-center">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
          variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
        }`}>
          <AlertCircle size={30} />
        </div>
        <p className="text-[#555] mb-8" style={{ fontFamily: 'DM Sans' }}>
          {message}
        </p>
        <div className="flex w-full gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'danger' ? 'primary' : 'primary'} // Assuming primary is the action button
            className={`flex-1 ${variant === 'danger' ? '!bg-red-500 hover:!bg-red-600' : ''}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
