'use client';

import React, { useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import CodeEditor from '../../components/CodeEditor';
import Button from '../../components/Button';
import Input from '../../components/Input';
import CodeResultDisplay from '../../components/CodeResultDisplay';
import { createCodeSession, CodeSessionResponse } from '../../lib/codeSessions';
import { CodeSessionStatus, CodeSessionType } from '../../lib/constants';

const GenerateCodePage: React.FC = () => {
  const [requirements, setRequirements] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [framework, setFramework] = useState('');
  const [result, setResult] = useState<CodeSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      // For code generation, the 'code' field of CreateCodeSessionRequest will be the requirements string
      // Base64 encode the requirements as the backend expects Base64 for the 'code' field
      const encodedRequirements = Buffer.from(requirements, 'utf8').toString('base64');

      const session = await createCodeSession({
        sessionType: CodeSessionType.GENERATION,
        code: encodedRequirements, // Requirements sent as code
        requestedLanguage: language,
        requestedFramework: framework,
        requestDetails: { prompt: requirements }, // Also send as prompt for backend processing
      });
      setResult(session);

      // In a real application, you would poll the session endpoint until status is COMPLETED or FAILED
      // For this example, we simulate immediate completion and a dummy output.
      // The backend has sent the SQS message for processing.
      // The frontend would need a polling mechanism to check session status.
      // For simplicity in this example, we'll just show pending and tell the user to check sessions.
      // A more complete solution would involve websockets or regular polling.
      console.log('Code generation request sent, check sessions page for updates.');
    } catch (err: any) {
      setError(err.message || 'Failed to generate code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-primary mb-6">Generate Code</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <TextArea
            id="requirements"
            label="Describe your requirements (e.g., 'A React component for a user profile card')"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={8}
            required
            placeholder="Tell me what you need..."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="language"
              label="Language"
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g., JavaScript, Python"
            />
            <Input
              id="framework"
              label="Framework (Optional)"
              type="text"
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              placeholder="e.g., React, Next.js, Django"
            />
          </div>
          <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
            Generate Code
          </Button>
          {error && <p className="text-danger mt-4">{error}</p>}
        </form>

        {result && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-dark mb-4">Generation Session Status:</h2>
            <p className="mb-2">Session ID: <span className="font-mono text-sm">{result.id}</span></p>
            <p className="mb-2">Status: <span className={`font-semibold ${result.status === CodeSessionStatus.PENDING ? 'text-orange-500' : 'text-gray-700'}`}>{result.status.toUpperCase()}</span></p>
            <p className="text-gray-700">Your request has been queued for processing. Please check the <Link href="/sessions" className="text-primary hover:underline">Sessions</Link> page for the complete result once it&apos;s ready.</p>
            {/* The result display below would only show actual code if we implemented polling.
                For now, it indicates the session is pending. */}
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

export default GenerateCodePage;