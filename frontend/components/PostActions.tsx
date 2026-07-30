'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';

interface PostActionsProps {
  postId: number;
  ownerId: number;
  initialTitle: string;
  initialContent: string;
}

export default function PostActions({ postId, ownerId, initialTitle, initialContent }: PostActionsProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only render if the currently logged in user owns this post
  const isOwner = !isLoading && user && user.id === ownerId;
  
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await apiFetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, content }),
      });
      setShowEdit(false);
      router.refresh(); // Refresh server component data
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await apiFetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      setShowDelete(false);
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (!isOwner) return null;

  return (
    <>
      <div className="mt-8 pt-6 border-t border-brand flex gap-4">
        <button 
          onClick={() => setShowEdit(true)}
          className="inline-block px-5 py-2 text-xs font-bold uppercase tracking-wider border border-brand text-ink bg-cream rounded-none hover:bg-gold hover:border-gold transition-colors cursor-pointer"
        >
          Edit Post
        </button>
        <button 
          onClick={() => setShowDelete(true)}
          className="inline-block px-5 py-2 text-xs font-bold uppercase tracking-wider border border-red-200 text-red-600 bg-red-50 rounded-none hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
        >
          Delete Post
        </button>
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white border border-brand shadow-2xl rounded-none">
            <div className="flex justify-between items-center px-6 py-4 border-b border-brand bg-cream">
              <h5 className="text-lg font-bold font-heading uppercase tracking-wide">Edit Post</h5>
              <button onClick={() => setShowEdit(false)} className="text-muted-grey hover:text-ink focus:outline-none text-xl font-bold transition-colors cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleEdit} className="m-0">
              <div className="px-6 py-6 space-y-4">
                {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm font-medium">{error}</div>}
                <div>
                  <label htmlFor="editTitle" className="block text-sm font-bold uppercase tracking-wider mb-2">Title</label>
                  <input type="text" id="editTitle" value={title} onChange={e => setTitle(e.target.value)} required className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white" />
                </div>
                <div>
                  <label htmlFor="editContent" className="block text-sm font-bold uppercase tracking-wider mb-2">Content</label>
                  <textarea id="editContent" rows={5} value={content} onChange={e => setContent(e.target.value)} required className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white"></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-brand">
                <button type="button" onClick={() => setShowEdit(false)} disabled={isSubmitting} className="px-5 py-2 text-xs font-bold uppercase tracking-wider border border-brand text-ink bg-white hover:bg-cream transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-xs font-bold uppercase tracking-wider border border-navy text-white bg-navy hover:bg-ink transition-colors disabled:opacity-50 cursor-pointer">{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-brand shadow-2xl rounded-none">
            <div className="flex justify-between items-center px-6 py-4 border-b border-brand bg-cream">
              <h5 className="text-lg font-bold font-heading uppercase tracking-wide">Delete Post?</h5>
              <button onClick={() => setShowDelete(false)} className="text-muted-grey hover:text-ink focus:outline-none text-xl font-bold transition-colors cursor-pointer">&times;</button>
            </div>
            <div className="px-6 py-6 text-ink">
              {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm font-medium">{error}</div>}
              Are you sure you want to delete this post? This action cannot be undone.
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-brand">
              <button type="button" onClick={() => setShowDelete(false)} disabled={isSubmitting} className="px-5 py-2 text-xs font-bold uppercase tracking-wider border border-brand text-ink bg-white hover:bg-cream transition-colors cursor-pointer">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={isSubmitting} className="px-5 py-2 text-xs font-bold uppercase tracking-wider border border-red-600 text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50">{isSubmitting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
