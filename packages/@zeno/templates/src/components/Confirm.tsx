"use client";

import { Modal } from "./Modal";

export interface ConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function Confirm({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  loading = false,
}: ConfirmProps) {
  const getConfirmButtonClass = () => {
    switch (variant) {
      case "danger":
        return "btn-error";
      case "warning":
        return "btn-warning";
      default:
        return "btn-primary";
    }
  };

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return "⚠️";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getIcon()}</span>
          <p className="text-base-content">{message}</p>
        </div>
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`btn ${getConfirmButtonClass()}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
