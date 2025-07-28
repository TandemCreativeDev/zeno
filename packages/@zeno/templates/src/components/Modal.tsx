"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
}: ModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    if (isOpen) {
      modal.showModal();
    } else {
      modal.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const handleClose = () => {
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    modal.addEventListener("close", handleClose);
    modal.addEventListener("keydown", handleKeyDown);

    return () => {
      modal.removeEventListener("close", handleClose);
      modal.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "modal-box-sm";
      case "lg":
        return "modal-box-lg";
      case "xl":
        return "modal-box-xl";
      default:
        return "";
    }
  };

  return (
    <dialog ref={modalRef} className="modal">
      <div className={`modal-box ${getSizeClass()} ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="py-4">{children}</div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose} aria-label="Close modal">
          close
        </button>
      </form>
    </dialog>
  );
}
