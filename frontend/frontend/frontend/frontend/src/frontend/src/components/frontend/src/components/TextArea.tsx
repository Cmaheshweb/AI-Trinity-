import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  id: string;
}

const TextArea: React.FC<TextAreaProps> = ({ label, error, id, className = '', ...props }) => {
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
      <textarea
        id={id}
        className={`${baseStyles} ${error ? errorStyles : defaultStyles} ${className}`}
        rows={5} // Default rows
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};

export default TextArea;