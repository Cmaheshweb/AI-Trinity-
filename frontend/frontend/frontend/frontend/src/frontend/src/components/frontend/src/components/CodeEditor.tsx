import React from 'react';
import TextArea from './TextArea'; // Using our custom TextArea

interface CodeEditorProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  id: string;
  language?: string; // Can be used for syntax highlighting in a real editor
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ label, error, id, language, readOnly, ...props }) => {
  return (
    <TextArea
      id={id}
      label={label || (readOnly ? 'Code Output' : 'Enter Your Code')}
      className="font-mono text-sm bg-gray-50 p-4 rounded-md resize-y"
      rows={readOnly ? 15 : 10}
      readOnly={readOnly}
      placeholder={readOnly ? 'Processing results...' : 'Start coding here...'}
      {...props}
    />
  );
};

export default CodeEditor;