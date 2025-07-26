// @ts-nocheck

"use client";

export interface FormActionsProps {
  mode: "create" | "edit";
  loading?: boolean;
  onCancel?: () => void;
  onReset?: () => void;
  submitText?: string;
  className?: string;
}

export function FormActions({
  mode,
  loading = false,
  onCancel,
  onReset,
  submitText,
  className = "",
}: FormActionsProps) {
  const defaultSubmitText =
    submitText || (mode === "create" ? "Create" : "Update");
  const loadingText = mode === "create" ? "Creating..." : "Updating...";

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 justify-end p-6 bg-base-100 rounded-lg shadow-sm ${className}`}
    >
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost"
          disabled={loading}
        >
          Cancel
        </button>
      )}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="btn btn-outline"
          disabled={loading}
        >
          Reset
        </button>
      )}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            {loadingText}
          </>
        ) : (
          defaultSubmitText
        )}
      </button>
    </div>
  );
}
