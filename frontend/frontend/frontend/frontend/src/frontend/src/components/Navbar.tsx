'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();

  return (
    <nav className="bg-dark text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-primary hover:text-secondary">
          AI TrinityPro
        </Link>
        <div className="space-x-4">
          <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
          {isAuthenticated ? (
            <>
              <span className="text-gray-300 hidden md:inline-block">Hello, {user?.firstName || user?.email}!</span>
              <Button onClick={logout} variant="outline" size="sm">Logout</Button>
            </>
          ) : (
            <>
              {!loading && ( // Only show login/register if not loading auth state
                <>
                  <Link href="/login" className="hover:text-primary">Login</Link>
                  <Link href="/register" className="hover:text-primary">Register</Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;