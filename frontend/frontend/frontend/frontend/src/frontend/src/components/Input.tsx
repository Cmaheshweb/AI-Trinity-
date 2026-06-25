import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  id: string; // Ensure id is always provided for accessibility
}

const Input: React.FC<InputProps> = ({ label, error, id, className = '', ...props }) => {
  const baseStyles = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm';
  const errorStyles = 'border-danger focus:ring-danger focus:border-danger';
  const defaultStyles = 'border-gray-300';

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-dark mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${baseStyles} ${error ? errorStyles : defaultStyles} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};

export default Input;