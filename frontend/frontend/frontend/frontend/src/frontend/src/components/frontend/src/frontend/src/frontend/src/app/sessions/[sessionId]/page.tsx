'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { fetchSessionDetails, CodeSessionResponse } from '../../../lib/codeSessions';
import Spinner from '../../../components/Spinner';
import CodeResultDisplay from '../../../components/CodeResultDisplay';
import Button from '../../../components/Button';
import Link from 'next/link';
import { CodeSessionStatus } from '../../../lib/constants';

const SessionDetailsPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<CodeSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const loadSessionDetails = async () => {
      try {
        setIsLoading(true);
        const details = await fetchSessionDetails(sessionId);
        setSession(details);
      } catch (err: any) {
        setError(err.message || 'Failed to load session details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionDetails();
    // Poll for status updates if session is still pending/processing
    const interval = setInterval(() => {
        if (session && (session.status === CodeSessionStatus.PENDING || session.status === CodeSessionStatus.PROCESSING)) {
            loadSessionDetails();
        } else if (!session || session.status === CodeSessionStatus.COMPLETED || session.status === CodeSessionStatus.FAILED) {
            clearInterval(interval); // Stop polling if completed or failed
        }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [sessionId, session]); // Rerun effect if sessionId or session status changes

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center min-h-[calc(100vh-120px)]">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="p-4 bg-red-100 border border-danger text-danger rounded-lg min-h-[calc(100vh-120px)]">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p>{error}</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!session) {
    return (
      <ProtectedRoute>
        <div className="p-6 bg-white rounded-lg shadow-md min-h-[calc(100vh-120px)]">
          <p className="text-gray-600">Session not found.</p>
        </div>
      </ProtectedRoute>
    );
  }

  const resultDisplayText = session.resultDetails
    ? JSON.stringify(session.resultDetails, null, 2)
    : `Session is ${session.status}. Awaiting processing results...`;

  return (
    <ProtectedRoute>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-primary mb-4">Session Details: {session.id.substring(0, 8)}...</h1>
        <Link href="/sessions">
            <Button variant="outline" size="sm" className="mb-6">Back to All Sessions</Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-dark mb-6">
          <p><strong>Type:</strong> <span className="capitalize">{session.sessionType.replace(/_/g, ' ')}</span></p>
          <p><strong>Status:</strong> <span className={`font-semibold capitalize ${
            session.status === CodeSessionStatus.COMPLETED ? 'text-green-600' :
            session.status === CodeSessionStatus.FAILED ? 'text-red-600' :
            'text-orange-600'
          }`}>{session.status}</span></p>
          <p><strong>Requested Language:</strong> {session.requestedLanguage || 'N/A'}</p>
          <p><strong>Requested Framework:</strong> {session.requestedFramework || 'N/A'}</p>
          <p><strong>Created At:</strong> {new Date(session.createdAt).toLocaleString()}</p>
          <p><strong>Expires At:</strong> {session.expiresAt ? new Date(session.expiresAt).toLocaleString() : 'N/A'}</p>
        </div>

        {session.status === CodeSessionStatus.COMPLETED || session.status === CodeSessionStatus.FAILED ? (
          <CodeResultDisplay
            label={session.status === CodeSessionStatus.COMPLETED ? "Processed Output" : "Error/Failure Details"}
            code={resultDisplayText}
            language={session.requestedLanguage}
            downloadUrl={session.outputDownloadUrl}
            error={session.status === CodeSessionStatus.FAILED ? (session.resultDetails as any)?.errorMessage || "Processing failed." : null}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg min-h-[200px]">
            <Spinner size="lg" />
            <p className="mt-3 text-lg text-gray-600">Your request is currently {session.status.toLowerCase()}...</p>
            <p className="text-gray-500 text-sm mt-1">This page will automatically update once processing is complete.</p>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
};

export default SessionDetailsPage;