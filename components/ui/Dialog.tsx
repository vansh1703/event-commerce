"use client";

import { useEffect } from "react";

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info" | "confirm";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
};

export default function Dialog({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  showCancel = false,
}: DialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "confirm":
        return (
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "success":
        return "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700";
      case "error":
        return "from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700";
      case "warning":
        return "from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700";
      case "confirm":
        return "from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700";
      default:
        return "from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {getIcon()}

        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 text-center mb-3">
          {title}
        </h2>

        <p className="text-gray-600 dark:text-gray-400 text-center mb-6 whitespace-pre-line">
          {message}
        </p>

        <div className={`flex gap-3 ${showCancel ? "" : "justify-center"}`}>
          {showCancel && (
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-2xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`${showCancel ? "flex-1" : "min-w-[120px]"} bg-gradient-to-r ${getButtonColor()} text-white py-3 px-6 rounded-2xl transition-all font-semibold shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}