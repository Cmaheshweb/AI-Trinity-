'use client';

import React, { useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import CodeEditor from '../../components/CodeEditor';
import Button from '../../components/Button';
import Input from '../../components/Input';
import TextArea from '../../components/TextArea';
import CodeResultDisplay from '../../components/CodeResultDisplay';
import { createCodeSession, CodeSessionResponse } from '../../lib/codeSessions';
import { CodeSessionStatus, CodeSessionType } from '../../lib/constants';
import Link from 'next/link';

const DeployAppPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [platform, setPlatform] = useState('AWS');
  const [serviceType, setServiceType] = useState('ECS'); // ECS, Lambda, EC2
  const [configParams, setConfigParams] = useState(''); // JSON string for config
  const [result, setResult] = useState<CodeSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setResult(null);

    let parsedConfigParams = {};
    try {
      if (configParams) {
        parsedConfigParams = JSON.parse(configParams);
      }
    } catch (parseError) {
      setError('Invalid JSON for configuration parameters.');
      setIsLoading(false);
      return;
    }

    try {
      // Base64 encode the code before sending
      const encodedCode = Buffer.from(code, 'utf8').toString('base64');

      const session = await createCodeSession({
        sessionType: CodeSessionType.DEPLOYMENT_ASSIST,
        code: encodedCode,
        requestDetails: {
          platform,
          serviceType,
          ...parsedConfigParams,
        },
      });
      setResult(session);
      console.log('Deployment assistance request sent, check sessions page for updates.');
    } catch (err: any) {
      setError(err.message || 'Failed to get deployment assistance.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-primary mb-6">Deployment Assistance</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <CodeEditor
            id="code-input"
            label="Upload your application's source code (e.g., Dockerfile, main app file)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder={`// main.js or Dockerfile content\nconsole.log('Hello from my app!');`}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="platform"
              label="Deployment Platform"
              type="text"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              readOnly // AWS is the default and only supported for now
            />
            <Input
              id="serviceType"
              label="Service Type"
              type="text"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="e.g., ECS, Lambda"
            />
          </div>
          <TextArea
            id="configParams"
            label="Additional Configuration Parameters (JSON)"
            value={configParams}
            onChange={(e) => setConfigParams(e.target.value)}
            rows={5}
            placeholder={`{\n  "memory": "512MB",\n  "cpu": "256",\n  "envVars": {\n    "NODE_ENV": "production"\n  }\n}`}
          />
          <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
            Get Deployment Configs
          </Button>
          {error && <p className="text-danger mt-4">{error}</p>}
        </form>

        {result && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-dark mb-4">Deployment Session Status:</h2>
            <p className="mb-2">Session ID: <span className="font-mono text-sm">{result.id}</span></p>
            <p className="mb-2">Status: <span className={`font-semibold ${result.status === CodeSessionStatus.PENDING ? 'text-orange-500' : 'text-gray-700'}`}>{result.status.toUpperCase()}</span></p>
            <p className="text-gray-700">Your request has been queued for processing. Please check the <Link href="/sessions" className="text-primary hover:underline">Sessions</Link> page for the complete configuration once it&apos;s ready.</p>
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

export default DeployAppPage;