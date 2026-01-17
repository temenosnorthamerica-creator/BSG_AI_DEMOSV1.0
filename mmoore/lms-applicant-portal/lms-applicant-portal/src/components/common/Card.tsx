import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
}

// SECU Brand Card Styles
export function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  variant = 'default'
}: CardProps) {
  const variantStyles = {
    default: 'bg-white shadow-sm border border-gray-200',
    elevated: 'bg-white shadow-md',
    outlined: 'bg-white border-2 border-gray-300',
  };

  return (
    <div
      className={`
        ${variantStyles[variant]}
        rounded-md p-6
        ${hoverable ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
