'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, logout, refreshUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsername(user.username);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(user.email);
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="p-8 text-center text-muted-grey font-medium">Loading...</div>;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsUpdating(true);

    try {
      await apiFetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ username, email }),
      });
      await refreshUser();
      setSuccess('Profile updated successfully!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError('');
    setIsDeleting(true);

    try {
      await apiFetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });
      logout();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
      setShowDeleteModal(false);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto bg-white border border-brand p-8 mt-8">
        <h2 className="text-3xl font-bold font-heading mb-6 text-ink border-b border-brand pb-4">Account Settings</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 text-sm font-medium">
            {success}
          </div>
        )}

        {/* Profile Info Section */}
        <div className="flex items-center gap-6 mb-8 bg-cream border border-brand p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
             className="rounded-full shrink-0 border border-brand object-cover h-24 w-24"
             src={user.image_path || "/static/profile_pics/default.jpg"}
             alt="Profile picture"
          />
          <div>
            <h5 className="text-2xl font-bold font-heading text-ink mb-1">{user.username}</h5>
            <p className="text-muted-grey text-sm font-medium">{user.email}</p>
          </div>
        </div>

        {/* Update Profile Form */}
        <div className="mb-8">
          <h3 className="text-lg font-bold uppercase tracking-wider mb-4 text-ink">Update Profile</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4 m-0">
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
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isUpdating}
                className="px-5 py-2 text-sm font-bold uppercase tracking-wider border border-navy text-white bg-navy hover:bg-ink transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>

        <hr className="border-brand mb-8" />

        {/* Profile Picture Section (Placeholder) */}
        <div className="mb-8 opacity-75">
          <h3 className="text-lg font-bold uppercase tracking-wider mb-2 text-ink">Profile Picture</h3>
          <p className="text-sm text-muted-grey mb-4">File upload coming in a future tutorial.</p>
          <input type="file" className="w-full border border-brand px-4 py-2 bg-gray-50 text-muted-grey cursor-not-allowed" disabled />
        </div>

        <hr className="border-brand mb-8" />

        {/* Password Reset Section (Placeholder) */}
        <div className="mb-8 opacity-75">
          <h3 className="text-lg font-bold uppercase tracking-wider mb-2 text-ink">Change Password</h3>
          <p className="text-sm text-muted-grey mb-4">Password reset coming in a future tutorial.</p>
          <form className="space-y-4 m-0">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-muted-grey">Current Password</label>
              <input type="password" className="w-full border border-brand px-4 py-2 bg-gray-50 cursor-not-allowed" disabled />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-muted-grey">New Password</label>
              <input type="password" className="w-full border border-brand px-4 py-2 bg-gray-50 cursor-not-allowed" disabled />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-muted-grey">Confirm New Password</label>
              <input type="password" className="w-full border border-brand px-4 py-2 bg-gray-50 cursor-not-allowed" disabled />
            </div>
            <div className="pt-2">
              <button type="button" className="px-5 py-2 text-sm font-bold uppercase tracking-wider border border-gray-400 text-gray-500 bg-gray-200 cursor-not-allowed" disabled>Change Password</button>
            </div>
          </form>
        </div>

        <hr className="border-brand mb-8" />

        {/* Logout Button */}
        <div className="mb-8">
          <button 
            type="button"
            onClick={logout}
            className="px-5 py-2 text-sm font-bold uppercase tracking-wider border border-brand text-ink bg-white hover:bg-cream transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>

        <hr className="border-brand mb-8" />

        {/* Danger Zone */}
        <div className="mb-4 bg-red-50 border border-red-200 p-6">
          <h3 className="text-lg font-bold uppercase tracking-wider mb-2 text-red-600">Danger Zone</h3>
          <p className="text-sm text-red-600/80 mb-4">
            Once you delete your account, there is no going back. All your posts will also be permanently deleted.
          </p>
          <button 
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2 text-sm font-bold uppercase tracking-wider border border-red-600 text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-red-600 shadow-2xl rounded-none">
            <div className="flex justify-between items-center px-6 py-4 border-b border-red-600 bg-red-600 text-white">
              <h5 className="text-lg font-bold font-heading uppercase tracking-wide">Delete Account?</h5>
              <button 
                type="button" 
                onClick={() => setShowDeleteModal(false)} 
                className="text-white/80 hover:text-white focus:outline-none text-xl font-bold transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-6 text-lg text-ink">
              <p>Are you sure you want to delete your account? This action cannot be undone. All your posts will be permanently deleted.</p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-red-600/20">
              <button 
                type="button" 
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider border border-brand text-ink bg-white hover:bg-cream transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider border border-red-600 text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
