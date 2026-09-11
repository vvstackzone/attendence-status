import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface WrapperProps {
  label: string;
  error?: string;
  required?: boolean;
  children?: ReactNode;
  hint?: string;
}

function FieldWrapper({ label, error, required, children, hint }: WrapperProps) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

type TextFieldProps = WrapperProps & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, error, required, hint, className, ...rest }: TextFieldProps) {
  return (
    <FieldWrapper label={label} error={error} required={required} hint={hint}>
      <input
        className={`input ${error ? "!border-red-400 focus:!border-red-500 focus:!ring-red-100 dark:!border-red-500/70 dark:focus:!ring-red-950" : ""} ${className || ""}`}
        {...rest}
      />
    </FieldWrapper>
  );
}

type SelectFieldProps = WrapperProps &
  SelectHTMLAttributes<HTMLSelectElement> & { options: { label: string; value: string }[]; placeholder?: string };

export function SelectField({ label, error, required, hint, options, placeholder, className, ...rest }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} error={error} required={required} hint={hint}>
      <select
        className={`input ${error ? "!border-red-400 focus:!border-red-500 focus:!ring-red-100 dark:!border-red-500/70 dark:focus:!ring-red-950" : ""} ${className || ""}`}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

type TextAreaFieldProps = WrapperProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({ label, error, required, hint, className, ...rest }: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label} error={error} required={required} hint={hint}>
      <textarea
        className={`input ${error ? "!border-red-400 focus:!border-red-500 focus:!ring-red-100 dark:!border-red-500/70 dark:focus:!ring-red-950" : ""} ${className || ""}`}
        rows={3}
        {...rest}
      />
    </FieldWrapper>
  );
}
