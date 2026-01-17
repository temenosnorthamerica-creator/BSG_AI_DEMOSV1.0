import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'accent' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

// SECU Brand Button Styles
const variantStyles = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300',
  outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white',
  success: 'bg-success text-white hover:bg-success-light shadow-sm',
  accent: 'bg-accent text-white hover:bg-accent-light shadow-sm',
  orange: 'bg-orange text-white hover:bg-orange-dark shadow-sm hover:shadow-md',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        rounded font-semibold transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
