'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If there's no token in the URL, block the form (like Jinja2 template did)
  if (!token) {
    return (
      <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm font-medium">
        Invalid or missing reset token. Please request a new password reset.
        <br/><br/>
        <Link href="/forgot-password" className="underline font-bold">Go to Forgot Password</Link>
      </div>
    );
  }

  /**
   * INTERN DOCUMENTATION: handleResetPassword
   * 1. Triggered when the user submits their new password.
   * 2. Checks if passwords match purely on the client side (saving a network request).
   * 3. Posts the `token` (from the URL) and `new_password` to the backend.
   * 4. If successful, alerts the user and redirects to the login page!
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiFetch('/api/users/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: token,
          new_password: newPassword,
        }),
        skipAuth: true,
      });

      setSuccess('Password reset successfully! You can now log in with your new password.');
      // Redirect after a brief delay so they can read the success message
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message + ' Please request a new password reset.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleResetPassword} className="space-y-4 m-0">
      
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 text-sm font-medium">
          {success}
          <br/><br/>
          Redirecting to login...
        </div>
      )}
      
      <div>
        <label htmlFor="newPassword" className="block text-sm font-bold uppercase tracking-wider mb-2 text-ink">New Password</label>
        <input 
          type="password"
          id="newPassword"
          required
          minLength={8}
          autoFocus
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white"
        />
        <p className="text-xs text-muted-grey mt-1">Password must be at least 8 characters.</p>
      </div>
      
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-bold uppercase tracking-wider mb-2 text-ink">Confirm New Password</label>
        <input 
          type="password"
          id="confirmPassword"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white"
        />
      </div>
      
      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isSubmitting || !!success}
          className="w-full px-5 py-3 text-sm font-bold uppercase tracking-wider border border-navy text-white bg-navy hover:bg-ink transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'RESETTING...' : 'RESET PASSWORD'}
        </button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto bg-white border border-brand p-8 mt-8">
      <h2 className="text-3xl font-bold font-heading mb-4 text-ink border-b border-brand pb-4">Reset Password</h2>
      <p className="text-muted-grey text-sm mb-6">Enter your new password below.</p>
      
      {/* 
        INTERN DOCUMENTATION: Suspense Boundary
        Next.js requires `useSearchParams` to be wrapped in a React Suspense boundary
        because it relies on data (the URL) that might not be available during server rendering.
      */}
      <Suspense fallback={<div className="text-muted-grey italic">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>

      <p className="mt-6 text-sm text-center text-muted-grey">
        Remember your password? <Link href="/login" className="font-bold text-navy hover:text-gold transition-colors">Login here</Link>
      </p>
    </div>
  );
}
