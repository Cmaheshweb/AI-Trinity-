'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { fetchUserSessions, CodeSessionResponse } from '../../lib/codeSessions';
import Spinner from '../../components/Spinner';
import Link from 'next/link';
import { CodeSessionStatus, CodeSessionType } from '../../lib/constants';

const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<CodeSessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        const userSessions = await fetchUserSessions();
        setSessions(userSessions);
      } catch (err: any) {
        setError(err.message || 'Failed to load sessions.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
    // Optional: Set up polling to refresh sessions status every few seconds
    const interval = setInterval(loadSessions, 15000); // Poll every 15 seconds
    return () => clearInterval(interval); // Clean up on unmount
  }, []);

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

  return (
    <ProtectedRoute>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-primary mb-6">Your Code Sessions</h1>

        {sessions.length === 0 ? (
          <p className="text-gray-600">You don't have any active or past code sessions. Start generating or debugging!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Session ID</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Type</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Language</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Created At</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b text-sm text-gray-800 font-mono">{session.id.substring(0, 8)}...</td>
                    <td className="py-3 px-4 border-b text-sm text-gray-800 capitalize">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        session.sessionType === CodeSessionType.GENERATION ? 'bg-blue-100 text-blue-800' :
                        session.sessionType === CodeSessionType.DEBUGGING ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {session.sessionType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-gray-800">{session.requestedLanguage || 'N/A'}</td>
                    <td className="py-3 px-4 border-b text-sm text-gray-800 capitalize">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        session.status === CodeSessionStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                        session.status === CodeSessionStatus.FAILED ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-gray-800">{new Date(session.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4 border-b text-sm">
                      <Link href={`/sessions/${session.id}`} className="text-primary hover:underline">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default SessionsPage;