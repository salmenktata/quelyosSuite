import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  rounded?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    rounded = true,
    className = '',
    disabled,
    ...props
  }, ref) => {
    const baseClasses = `inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${rounded ? 'rounded-[20px]' : 'rounded-lg'}`;

    const variantClasses = {
      primary: 'bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 focus:ring-ring',
      secondary: 'bg-secondary text-gray-900 hover:bg-secondary-dark hover:shadow-lg hover:-translate-y-0.5 focus:ring-ring',
      outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white hover:shadow-lg hover:-translate-y-0.5 focus:ring-ring',
      ghost: 'text-primary hover:bg-primary/10 focus:ring-ring',
      danger: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5 focus:ring-red-500',
      success: 'bg-green-500 text-white hover:bg-green-600 hover:shadow-lg hover:-translate-y-0.5 focus:ring-green-500',
    };

    const sizeClasses = {
      sm: 'px-4 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-8 py-3 text-lg',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
export { Button };
