// @ts-nocheck

"use client";

import { HTMLInputTypeAttribute, useId } from "react";
import {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";

export interface SelectOption {
  value: string;
  label: string;
}

export interface ValidationRules {
  required?: boolean | string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: {
    value: RegExp;
    message: string;
  };
  email?: boolean;
  url?: boolean;
}

export interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: HTMLInputTypeAttribute | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: SelectOption[];
  validation?: ValidationRules;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  className?: string;
}

export function FormField<T extends FieldValues>({
  name,
  label,
  type = "text",
  required = false,
  placeholder,
  helpText,
  options,
  validation = {},
  register,
  errors,
  className = "",
}: FormFieldProps<T>) {
  const fieldId = useId();
  const labelId = `${fieldId}-label`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  // Build aria-describedby string
  const ariaDescribedByIds = [];
  if (helpText) ariaDescribedByIds.push(helpId);
  if (errors[name]) ariaDescribedByIds.push(errorId);
  const ariaDescribedBy =
    ariaDescribedByIds.length > 0 ? ariaDescribedByIds.join(" ") : undefined;

  // Convert validation rules to react-hook-form format
  const validationRules: Record<string, unknown> = {};

  if (required || validation.required) {
    validationRules.required =
      typeof validation.required === "string"
        ? validation.required
        : `${label} is required`;
  }

  if (validation.min !== undefined) {
    if (type === "number") {
      validationRules.min = {
        value: validation.min,
        message: `${label} must be at least ${validation.min}`,
      };
    } else {
      validationRules.minLength = {
        value: validation.min,
        message: `${label} must be at least ${validation.min} characters`,
      };
    }
  }

  if (validation.max !== undefined) {
    if (type === "number") {
      validationRules.max = {
        value: validation.max,
        message: `${label} must be at most ${validation.max}`,
      };
    } else {
      validationRules.maxLength = {
        value: validation.max,
        message: `${label} must be at most ${validation.max} characters`,
      };
    }
  }

  if (validation.minLength !== undefined) {
    validationRules.minLength = {
      value: validation.minLength,
      message: `${label} must be at least ${validation.minLength} characters`,
    };
  }

  if (validation.maxLength !== undefined) {
    validationRules.maxLength = {
      value: validation.maxLength,
      message: `${label} must be at most ${validation.maxLength} characters`,
    };
  }

  if (validation.pattern) {
    validationRules.pattern = validation.pattern;
  }

  if (validation.email || type === "email") {
    validationRules.pattern = {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Please enter a valid email address",
    };
  }

  if (validation.url || type === "url") {
    validationRules.pattern = {
      value: /^https?:\/\//,
      message: "Please enter a valid URL",
    };
  }

  const errorMessage = errors[name]?.message as string;

  // Common props for all input types
  const commonProps = {
    id: fieldId,
    "aria-labelledby": labelId,
    "aria-describedby": ariaDescribedBy,
    "aria-required": required || undefined,
    ...register(name, validationRules),
  };

  // Render input based on type
  const renderInput = () => {
    switch (type) {
      case "checkbox":
        return <input {...commonProps} type="checkbox" className="checkbox" />;

      case "select":
        return (
          <select {...commonProps} className="select select-bordered w-full">
            <option value="">{placeholder || `Select ${label}`}</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "textarea":
        return (
          <textarea
            {...commonProps}
            className="textarea textarea-bordered h-24"
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          />
        );

      default:
        return (
          <input
            {...commonProps}
            type={type}
            className="input input-bordered w-full"
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            min={
              type === "number" && validation.min !== undefined
                ? validation.min
                : undefined
            }
            max={
              type === "number" && validation.max !== undefined
                ? validation.max
                : undefined
            }
          />
        );
    }
  };

  // Special layout for checkbox
  if (type === "checkbox") {
    return (
      <div className={`form-control ${className}`}>
        <label htmlFor={fieldId} id={labelId} className="label cursor-pointer">
          <span className="label-text">{label}</span>
          {renderInput()}
        </label>
        {helpText && (
          <div id={helpId} className="label">
            <span className="label-text-alt">{helpText}</span>
          </div>
        )}
        {errorMessage && (
          <div id={errorId} className="label" role="alert">
            <span className="label-text-alt text-error">{errorMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Standard layout for all other input types
  return (
    <div className={`form-control w-full ${className}`}>
      <label htmlFor={fieldId} id={labelId} className="label">
        <span className="label-text">
          {label}
          {required ? " *" : ""}
        </span>
      </label>
      {renderInput()}
      {helpText && (
        <div id={helpId} className="label">
          <span className="label-text-alt">{helpText}</span>
        </div>
      )}
      {errorMessage && (
        <div id={errorId} className="label" role="alert">
          <span className="label-text-alt text-error">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
