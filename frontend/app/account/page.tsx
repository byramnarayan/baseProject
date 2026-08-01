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
  
  // New state variables for Profile Picture feature
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const [isDeletingPic, setIsDeletingPic] = useState(false);

  // New state variables for Change Password feature
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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

  /**
   * INTERN DOCUMENTATION: handleFileChange
   * 1. This function is triggered when a user selects a file using the <input type="file">.
   * 2. It grabs the first file from the event target (`e.target.files?.[0]`).
   * 3. It uses `URL.createObjectURL(file)` to generate a temporary local URL for the image.
   * 4. This temporary URL is saved in the `previewUrl` state to display a preview before uploading.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  /**
   * INTERN DOCUMENTATION: handleUploadPicture
   * 1. Because file uploads require "multipart/form-data" instead of a JSON string,
   *    we create a new `FormData` object and append our `selectedFile` to it.
   * 2. We use `apiFetch` to send a PATCH request to our backend endpoint.
   * 3. Note that we do NOT set `Content-Type: application/json` here. `apiFetch` handles omitting it
   *    when it detects `FormData`, allowing the browser to automatically set the correct boundary headers.
   * 4. After a successful upload, we refresh the user data to reflect the new image globally.
   */
  const handleUploadPicture = async () => {
    if (!selectedFile || !user) return;
    setError('');
    setSuccess('');
    setIsUploadingPic(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await apiFetch(`/api/users/${user.id}/picture`, {
        method: 'PATCH',
        body: formData, // Sending FormData instead of JSON
      });
      await refreshUser();
      setSuccess('Profile picture updated successfully!');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during upload.');
      }
    } finally {
      setIsUploadingPic(false);
    }
  };

  /**
   * INTERN DOCUMENTATION: handleDeletePicture
   * 1. Sends a DELETE request to our dedicated profile picture endpoint.
   * 2. On success, refreshes the user data (falling back to the default avatar).
   */
  const handleDeletePicture = async () => {
    if (!user) return;
    setError('');
    setSuccess('');
    setIsDeletingPic(true);

    try {
      await apiFetch(`/api/users/${user.id}/picture`, {
        method: 'DELETE',
      });
      await refreshUser();
      setSuccess('Profile picture removed!');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while deleting.');
      }
    } finally {
      setIsDeletingPic(false);
    }
  };

  /**
   * INTERN DOCUMENTATION: handleChangePassword
   * 1. This function is triggered when the user wants to change their password from the account page.
   * 2. First, we do a client-side check to ensure `newPassword` and `confirmNewPassword` match.
   * 3. We send a PATCH request to `/api/users/me/password`.
   * 4. Notice that we don't have to manually pass the JWT token in `apiFetch`. The `apiFetch` utility 
   *    automatically pulls the token from localStorage and attaches it to the Authorization header for us!
   */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await apiFetch('/api/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError('An unexpected error occurred while changing password.');
      }
    } finally {
      setIsChangingPassword(false);
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

        {/* Profile Picture Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold uppercase tracking-wider mb-2 text-ink">Profile Picture</h3>
          <p className="text-sm text-muted-grey mb-4">Upload a new profile picture (JPEG, PNG). Max 5MB.</p>
          {/* Image Preview Area (Like the original Jinja2 template) */}
          {previewUrl && (
            <div className="mb-4">
              <p className="text-xs font-bold uppercase text-gold mb-2 tracking-wider">Preview:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={previewUrl} 
                alt="Image Preview" 
                className="w-32 h-32 object-cover rounded-full border border-brand" 
              />
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="w-full sm:w-auto border border-brand px-4 py-2 bg-white text-sm focus:outline-none cursor-pointer" 
            />
            {selectedFile && (
              <button 
                type="button"
                onClick={handleUploadPicture}
                disabled={isUploadingPic}
                className="px-5 py-2 text-sm font-bold uppercase tracking-wider border border-navy text-white bg-navy hover:bg-ink transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {isUploadingPic ? 'Uploading...' : 'Update Picture'}
              </button>
            )}
          </div>
          
          {user.image_path && (
            <button 
              type="button"
              onClick={handleDeletePicture}
              disabled={isDeletingPic}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-red-600 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isDeletingPic ? 'Removing...' : 'Remove Current Picture'}
            </button>
          )}
        </div>

        <hr className="border-brand mb-8" />

        {/* Change Password Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold uppercase tracking-wider mb-4 text-ink">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4 m-0">
            {passwordError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm font-medium">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-100 border border-green-400 text-green-700 text-sm font-medium">
                {passwordSuccess}
              </div>
            )}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-bold uppercase tracking-wider mb-2 text-ink">Current Password</label>
              <input 
                type="password" 
                id="currentPassword"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white" 
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-bold uppercase tracking-wider mb-2 text-ink">New Password</label>
              <input 
                type="password" 
                id="newPassword"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white" 
              />
              <p className="text-xs text-muted-grey mt-1">Password must be at least 8 characters.</p>
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-bold uppercase tracking-wider mb-2 text-ink">Confirm New Password</label>
              <input 
                type="password" 
                id="confirmNewPassword"
                required
                minLength={8}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white" 
              />
            </div>
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isChangingPassword}
                className="px-5 py-2 text-sm font-bold uppercase tracking-wider border border-navy text-white bg-navy hover:bg-ink transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isChangingPassword ? 'CHANGING...' : 'Change Password'}
              </button>
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
