import React from 'react';
import CodeEditor from './CodeEditor';
import Button from './Button';

interface CodeResultDisplayProps {
  label?: string;
  code: string;
  language?: string;
  downloadUrl?: string;
  isLoading?: boolean;
  error?: string;
}

const CodeResultDisplay: React.FC<CodeResultDisplayProps> = ({
  label = 'Result',
  code,
  language,
  downloadUrl,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg min-h-[200px]">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
        <p className="mt-3 text-gray-600">Processing your request...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-danger text-danger rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="p-4 bg-gray-100 text-gray-600 rounded-lg">
        <p>No results to display yet. Please submit your request.</p>
      </div>
    );
  }

  return (
    <div className="relative mt-6">
      <CodeEditor
        id="code-result"
        label={label}
        value={code}
        language={language}
        readOnly
      />
      {downloadUrl && (
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
          <Button className="absolute top-0 right-0 m-4 px-3 py-1.5 text-sm">
            Download Output
          </Button>
        </a>
      )}
    </div>
  );
};

export default CodeResultDisplay;