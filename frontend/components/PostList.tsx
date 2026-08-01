'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Post, PaginatedPostsResponse } from '@/types';
import { apiFetch } from '@/lib/api';

/**
 * INTERN DOCUMENTATION: Client Components vs Server Components
 * In Next.js App Router, pages default to Server Components for performance/SEO.
 * However, Server Components CANNOT use state (`useState`) or handle user interactions (`onClick`).
 * Because we need a "Load More" button that fetches extra data dynamically without reloading the page,
 * we must extract this logic into a Client Component (marked with 'use client' at the top).
 */
interface PostListProps {
  initialData: PaginatedPostsResponse;
  apiEndpoint: string;
}

export default function PostList({ initialData, apiEndpoint }: PostListProps) {
  // We initialize our state with the data fetched on the server during the initial page load.
  const [posts, setPosts] = useState<Post[]>(initialData.posts);
  const [hasMore, setHasMore] = useState(initialData.has_more);
  
  // The current offset starts at the initial load limit
  const [skip, setSkip] = useState(initialData.posts.length);
  const limit = initialData.limit;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * INTERN DOCUMENTATION: loadMorePosts
   * This function mirrors the Vanila JS `loadMorePosts` from the old Jinja2 template.
   * 1. It sets `isLoading` to true so the button shows "LOADING...".
   * 2. It hits the API with the current `skip` and `limit`.
   * 3. It appends the new posts to the EXISTING posts array using React state setter.
   * 4. It updates the `skip` pointer and `hasMore` flag.
   */
  const loadMorePosts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Note: We use skipAuth: true assuming the posts feed is public. 
      // If some endpoints require auth, this logic can be adjusted or passed via props.
      type ApiPost = Omit<Post, 'created_at'> & { date_posted?: string };
      type ApiPaginatedResponse = Omit<PaginatedPostsResponse, 'posts'> & { posts: ApiPost[] };

      const data = await apiFetch<ApiPaginatedResponse>(`${apiEndpoint}?skip=${skip}&limit=${limit}`, { skipAuth: true });
      
      // Map backend `date_posted` to frontend `created_at` 
      const newPosts = data.posts.map(p => ({
        ...p,
        created_at: p.date_posted || (p as unknown as Post).created_at
      })) as Post[];

      setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      setSkip((prevSkip) => prevSkip + newPosts.length);
      setHasMore(data.has_more);
    } catch (err: unknown) {
      console.error('Error loading posts:', err);
      setError('ERROR - CLICK TO RETRY');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div id="postsContainer">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article key={post.id} className="bg-white border border-brand rounded-none p-5 mb-6 group card-shadow-hover">
              <div className="flex items-start gap-4">
                
                {/* Profile Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {post.author.image_path ? (
                  <img 
                    className="rounded-full shrink-0 border border-brand object-cover h-12 w-12" 
                    src={post.author.image_path} 
                    alt={`${post.author.username}'s profile picture`} 
                    loading="lazy" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full shrink-0 border border-brand bg-cream flex items-center justify-center text-navy font-bold text-xl uppercase">
                    {post.author.username.charAt(0)}
                  </div>
                )}

                {/* Article Content */}
                <div className="grow">
                  
                  {/* Metadata */}
                  <div className="mb-2 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-muted-grey">
                    <Link className="hover:text-gold transition-colors" href={`/user/${post.author.id}`}>
                      {post.author.username}
                    </Link>
                    <span>&middot;</span>
                    <span>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })}</span>
                    <span>&middot;</span>
                    <span>5 MIN READ</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold font-heading mt-1 mb-2 leading-tight">
                    <Link className="text-ink hover:text-gold transition-colors" href={`/post/${post.id}`}>
                      {post.title}
                    </Link>
                  </h2>

                  {/* Content */}
                  <p className="text-ink leading-relaxed mb-4 text-lg line-clamp-3">{post.content}</p>

                  <Link href={`/post/${post.id}`} className="text-sm font-bold text-navy hover:text-gold uppercase tracking-wider border-b-2 border-navy hover:border-gold transition-colors">
                    Read Full Article &rarr;
                  </Link>
                </div>
              </div>
            </article>
          ))
        ) : (
           <div className="bg-cream border border-brand p-8 text-center mb-6">
             <p className="text-muted-grey italic">No posts found.</p>
           </div>
        )}
      </div>

      {hasMore && (
        <div className="text-center mb-12">
          <button 
            type="button" 
            onClick={loadMorePosts}
            disabled={isLoading}
            className="border-2 border-navy text-navy hover:bg-navy hover:text-white px-6 py-3 rounded-none font-bold text-sm tracking-wide transition-colors uppercase disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'LOADING...' : error || 'Load More Posts'}
          </button>
        </div>
      )}
    </>
  );
}
