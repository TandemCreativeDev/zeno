"use client";

export interface LoadingProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export function Loading({
  size = "md",
  message = "Loading...",
  className = "",
}: LoadingProps) {
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "loading-sm";
      case "lg":
        return "loading-lg";
      default:
        return "loading-md";
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
    >
      <span className={`loading loading-spinner ${getSizeClass()}`}></span>
      {message && <p className="mt-4 text-base-content/70">{message}</p>}
    </div>
  );
}
