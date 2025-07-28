"use client";

export interface FormActionsProps {
  mode?: "create" | "edit" | "view";
  loading?: boolean;
  onCancel?: () => void;
  onReset?: () => void;
  submitText?: string;
  className?: string;
}

export function FormActions({
  mode = "create",
  loading = false,
  onCancel,
  onReset,
  submitText,
  className = "",
}: FormActionsProps) {
  const getSubmitText = () => {
    if (submitText) return submitText;
    switch (mode) {
      case "edit":
        return "Update";
      case "create":
        return "Create";
      default:
        return "Save";
    }
  };

  if (mode === "view") {
    return (
      <div className={`flex gap-4 justify-end ${className}`}>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex gap-4 justify-end ${className}`}>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="btn btn-ghost"
          disabled={loading}
        >
          Reset
        </button>
      )}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
      )}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Processing...
          </>
        ) : (
          getSubmitText()
        )}
      </button>
    </div>
  );
}
