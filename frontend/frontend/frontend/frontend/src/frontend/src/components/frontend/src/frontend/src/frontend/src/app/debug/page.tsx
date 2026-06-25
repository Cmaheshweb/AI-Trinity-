'use client';

import React, { useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import CodeEditor from '../../components/CodeEditor';
import Button from '../../components/Button';
import Input from '../../components/Input';
import CodeResultDisplay from '../../components/CodeResultDisplay';
import { createCodeSession, CodeSessionResponse } from '../../lib/codeSessions';
import { CodeSessionStatus, CodeSessionType } from '../../lib/constants';
import Link from 'next/link';

const DebugCodePage: React.FC = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [result, setResult] = useState<CodeSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      // Base64 encode the code before sending
      const encodedCode = Buffer.from(code, 'utf8').toString('base64');

      const session = await createCodeSession({
        sessionType: CodeSessionType.DEBUGGING,
        code: encodedCode,
        requestedLanguage: language,
        requestDetails: { debugOptions: ['syntax', 'runtime', 'security'] }, // Example options
      });
      setResult(session);
      console.log('Code debugging request sent, check sessions page for updates.');
    } catch (err: any) {
      setError(err.message || 'Failed to debug code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-primary mb-6">Debug Code</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <CodeEditor
            id="code-input"
            label="Enter your code to debug"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder={`function sum(a, b) {\n  return a + c; // Typo here\n}`}
          />
          <Input
            id="language"
            label="Language"
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g., JavaScript, Python"
          />
          <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
            Debug Code
          </Button>
          {error && <p className="text-danger mt-4">{error}</p>}
        </form>

        {result && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-dark mb-4">Debugging Session Status:</h2>
            <p className="mb-2">Session ID: <span className="font-mono text-sm">{result.id}</span></p>
            <p className="mb-2">Status: <span className={`font-semibold ${result.status === CodeSessionStatus.PENDING ? 'text-orange-500' : 'text-gray-700'}`}>{result.status.toUpperCase()}</span></p>
            <p className="text-gray-700">Your request has been queued for processing. Please check the <Link href="/sessions" className="text-primary hover:underline">Sessions</Link> page for the complete result once it&apos;s ready.</p>
            <CodeResultDisplay
              label="Initial Response"
              code={JSON.stringify(result, null, 2)}
              isLoading={isLoading}
              error={error}
            />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default DebugCodePage;