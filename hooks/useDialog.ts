"use client";

import { useState } from "react";

type DialogConfig = {
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info" | "confirm";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
};

export function useDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DialogConfig>({
    title: "",
    message: "",
    type: "info",
  });

  const showDialog = (dialogConfig: DialogConfig) => {
    setConfig(dialogConfig);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
  };

  // Convenience methods
  const showSuccess = (title: string, message: string) => {
    showDialog({ title, message, type: "success" });
  };

  const showError = (title: string, message: string) => {
    showDialog({ title, message, type: "error" });
  };

  const showWarning = (title: string, message: string) => {
    showDialog({ title, message, type: "warning" });
  };

  const showInfo = (title: string, message: string) => {
    showDialog({ title, message, type: "info" });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = "Confirm",
    cancelText = "Cancel"
  ) => {
    showDialog({
      title,
      message,
      type: "confirm",
      onConfirm,
      confirmText,
      cancelText,
      showCancel: true,
    });
  };

  return {
    isOpen,
    config,
    closeDialog,
    showDialog,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
}