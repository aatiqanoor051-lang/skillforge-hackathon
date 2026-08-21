import React from 'react';

export default function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-brand-steel/20 bg-[#1a3145] p-5 shadow-card sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}
