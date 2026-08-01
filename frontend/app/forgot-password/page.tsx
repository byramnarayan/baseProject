'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * INTERN DOCUMENTATION: handleForgotPassword
   * 1. This function is triggered when the user submits the forgot password form.
   * 2. It grabs the email from React state and POSTs it to the FastAPI backend.
   * 3. Just like the Jinja2 vanilla JS script, we use our custom `apiFetch` which handles headers.
   * 4. A 202 Accepted response means the backend accepted the request. It returns success
   *    even if the email doesn't exist to prevent "Email Enumeration" security risks.
   */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      // Send the email as JSON. skipAuth is true because they aren't logged in.
      await apiFetch('/api/users/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        skipAuth: true,
      });

      // Show success message and clear the input
      setSuccess('If an account exists with this email, you will receive password reset instructions shortly.');
      setEmail('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white border border-brand p-8 mt-8">
      <h2 className="text-3xl font-bold font-heading mb-4 text-ink border-b border-brand pb-4">Forgot Password</h2>
      <p className="text-muted-grey text-sm mb-6">Enter your email address and we&apos;ll send you a link to reset your password.</p>
      
      <form onSubmit={handleForgotPassword} className="space-y-4 m-0">
        
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 text-sm font-medium">
            {success}
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-bold uppercase tracking-wider mb-2 text-ink">Email</label>
          <input 
            type="email"
            id="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white"
          />
        </div>
        
        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full px-5 py-3 text-sm font-bold uppercase tracking-wider border border-navy text-white bg-navy hover:bg-ink transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'SENDING...' : 'SEND RESET LINK'}
          </button>
        </div>
      </form>
      
      <p className="mt-6 text-sm text-center text-muted-grey">
        Remember your password? <Link href="/login" className="font-bold text-navy hover:text-gold transition-colors">Login here</Link>
      </p>
    </div>
  );
}
