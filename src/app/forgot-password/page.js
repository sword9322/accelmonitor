'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <ForgotPasswordForm />
    </div>
  );
} 