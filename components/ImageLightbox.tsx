
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CloseIcon } from './icons';

interface ImageLightboxProps {
  imageSrc: string;
  imageName: string;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageSrc, imageName, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4 animate-fade-in-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div
        className="relative max-w-4xl max-h-full animate-slide-up flex flex-col items-center"
        onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
      >
        <img src={imageSrc} alt={imageName} className="block max-h-[85vh] w-auto h-auto rounded-lg shadow-2xl object-contain" />
        <p className="text-center text-white mt-3 font-semibold text-lg">{imageName}</p>
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 p-2 bg-gray-800/80 border border-gray-600 rounded-full text-white hover:bg-gray-700 transition-colors"
          aria-label="Close image view"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>
      <style>{`
        @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}</style>
    </div>,
    document.body
  );
};

export default ImageLightbox;
