import Link from 'next/link';
import { Post, User, PaginatedPostsResponse } from '@/types';
import { apiFetch } from '@/lib/api';
import PostList from '@/components/PostList';

async function getUser(id: string): Promise<User | null> {
  try {
    return await apiFetch<User>(`/api/users/${id}`, { skipAuth: true, cache: 'no-store' });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}

async function getUserPosts(id: string): Promise<PaginatedPostsResponse> {
  try {
    type ApiPost = Omit<Post, 'created_at'> & { date_posted?: string };
    type ApiPaginatedResponse = Omit<PaginatedPostsResponse, 'posts'> & { posts: ApiPost[] };
    
    const res = await apiFetch<ApiPaginatedResponse>(`/api/users/${id}/posts?skip=0&limit=10`, { skipAuth: true, cache: 'no-store' });
    
    const mappedPosts = res.posts.map(p => ({
      ...p,
      created_at: p.date_posted || (p as unknown as Post).created_at
    })) as Post[];
    
    return { ...res, posts: mappedPosts };
  } catch (error) {
    console.error("Failed to fetch user posts:", error);
    return { posts: [], total: 0, skip: 0, limit: 10, has_more: false };
  }
}

export default async function UserPostsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getUser(resolvedParams.id);
  const paginatedData = await getUserPosts(resolvedParams.id);
  
  if (!user) {
    return (
      <div className="bg-cream border border-brand p-8 text-center mt-8">
        <h2 className="text-2xl font-bold font-heading text-ink mb-2">User not found</h2>
        <p className="text-muted-grey mb-4">This user does not exist.</p>
        <Link href="/" className="text-navy font-bold hover:text-gold transition-colors">&larr; Back to Home</Link>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="border-b border-brand pb-4 mb-8">
        <h1 className="text-3xl font-bold font-heading text-ink">
          Posts by {user.username}
        </h1>
        <p className="text-muted-grey mt-2">Viewing all contributions from this member.</p>
      </div>

      <PostList initialData={paginatedData} apiEndpoint={`/api/users/${user.id}/posts`} />
    </>
  );
}
