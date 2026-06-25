'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Spinner from '../../components/Spinner';
import Link from 'next/link';
import FeatureCard from '../../components/FeatureCard'; // New import

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [welcomeMessage, setWelcomeMessage] = useState('Loading dashboard...');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login'); // Redirect to login if not authenticated
    } else if (isAuthenticated && user) {
      setWelcomeMessage(`Welcome to your Dashboard, ${user.firstName || user.email}!`);
    }
  }, [isAuthenticated, loading, router, user]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-120px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-4xl font-bold text-primary mb-4">Dashboard</h1>
      <p className="text-lg text-dark mb-6">{welcomeMessage}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          title="Code Generation"
          description="Generate production-ready code snippets and full applications based on your specifications."
          link="/generate"
          buttonText="Start Generating"
        />
        <FeatureCard
          title="Code Debugging"
          description="Upload your code, find bugs, security vulnerabilities, and get optimized solutions."
          link="/debug"
          buttonText="Debug Code"
        />
        <FeatureCard
          title="Deployment Assistance"
          description="Get help deploying your applications to AWS with Dockerfiles, CI/CD, and configurations."
          link="/deploy"
          buttonText="Deploy App"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-3xl font-semibold text-dark mb-4">Your Recent Activity</h2>
        <Link href="/sessions">
          <button className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-primary transition duration-200">View All Sessions</button>
        </Link>
        {/* Placeholder for future activity list */}
      </div>
    </div>
  );
};

export default DashboardPage;