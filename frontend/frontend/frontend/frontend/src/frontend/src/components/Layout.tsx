'use client';

import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import { AuthProvider } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-4">{children}</main>
        {/* <footer className="bg-dark text-white p-4 text-center">
          &copy; {new Date().getFullYear()} AI TrinityPro. All rights reserved.
        </footer> */}
      </div>
    </AuthProvider>
  );
};

export default Layout;