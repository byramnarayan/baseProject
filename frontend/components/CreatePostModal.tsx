'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

interface CreatePostModalProps {
  onClose: () => void;
}

export default function CreatePostModal({ onClose }: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      });
      
      // On success, close the modal and refresh the page to show the new post
      onClose();
      window.location.reload();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white border border-brand shadow-2xl rounded-none">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-brand bg-cream">
          <h5 className="text-lg font-bold font-heading uppercase tracking-wide">New Post</h5>
          <button 
            type="button"
            onClick={onClose}
            className="text-muted-grey hover:text-ink focus:outline-none text-xl font-bold transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="m-0">
          <div className="px-6 py-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="title" className="block text-sm font-bold uppercase tracking-wider mb-2">Title</label>
              <input 
                type="text" 
                id="title" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white"
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-bold uppercase tracking-wider mb-2">Content</label>
              <textarea 
                id="content" 
                rows={5} 
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-brand px-4 py-2 focus:outline-none focus:border-ink bg-white"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-brand">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider border border-brand text-ink bg-white hover:bg-cream transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider border border-navy text-white bg-navy hover:bg-ink transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}
