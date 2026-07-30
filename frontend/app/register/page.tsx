'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });

      setSuccessMsg('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white border border-brand p-8 mt-8">
      <h2 className="text-3xl font-bold font-heading mb-6 text-ink border-b border-brand pb-4">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4 m-0">
        
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 text-sm font-medium">
            {successMsg}
          </div>
        )}
        
        <div>
          <label htmlFor="username" className="block text-sm font-bold uppercase tracking-wider mb-2 text-ink">Username</label>
          <input 
            type="text"
            id="username"
            required
            minLength={1}
            maxLength={50}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-bold uppercase tracking-wider mb-2 text-ink">Email</label>
          <input 
            type="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-bold uppercase tracking-wider mb-2 text-ink">Password</label>
          <input 
            type="password"
            id="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white"
          />
          <p className="text-xs text-muted-grey mt-1">Must be at least 8 characters.</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-bold uppercase tracking-wider mb-2 text-ink">Confirm Password</label>
          <input 
            type="password"
            id="confirmPassword"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white"
          />
          {password && confirmPassword && password !== confirmPassword && (
             <div className="text-xs text-red-600 font-bold mt-1">Passwords do not match.</div>
          )}
        </div>
        
        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting || (password !== confirmPassword && confirmPassword.length > 0)}
            className="w-full px-5 py-3 text-sm font-bold uppercase tracking-wider border border-navy text-white bg-navy hover:bg-ink transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>
      
      <p className="mt-6 text-sm text-center text-muted-grey">
        Already have an account? <Link href="/login" className="font-bold text-navy hover:text-gold transition-colors">Login here</Link>
      </p>
    </div>
  );
}
