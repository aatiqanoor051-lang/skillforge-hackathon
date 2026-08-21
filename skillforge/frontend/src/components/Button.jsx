import React from 'react';

const VARIANTS = {
  primary:
    'bg-brand-orchid text-brand-navy hover:opacity-90 focus-visible:outline-brand-orchid',
  secondary:
    'border border-brand-steel/40 text-brand-light hover:border-brand-orchid hover:text-brand-orchid focus-visible:outline-brand-orchid',
  ghost: 'text-brand-steel hover:text-brand-light focus-visible:outline-brand-orchid',
  danger: 'bg-red-500/90 text-white hover:bg-red-500 focus-visible:outline-red-400',
};

export default function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
