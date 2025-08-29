import React from "react";
import { cn } from "../../utils/cn";
import { AlertCircle, CheckCircle } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      success = false,
      leftIcon,
      rightIcon,
      helperText,
      fullWidth = false,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseStyles =
      "block w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed";

    const states = {
      default: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
      error: "border-red-300 focus:border-red-500 focus:ring-red-500",
      success: "border-green-300 focus:border-green-500 focus:ring-green-500",
    };

    const getState = () => {
      if (error) return "error";
      if (success) return "success";
      return "default";
    };

    return (
      <div className={cn(fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{leftIcon}</span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseStyles,
              states[getState()],
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{rightIcon}</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          )}

          {success && !error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p
            className={cn(
              "mt-1 text-sm",
              error ? "text-red-600" : "text-gray-500"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
