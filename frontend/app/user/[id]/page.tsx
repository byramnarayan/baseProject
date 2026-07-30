import Link from 'next/link';
import { Post, User } from '@/types';
import { apiFetch } from '@/lib/api';

async function getUser(id: string): Promise<User | null> {
  try {
    return await apiFetch<User>(`/api/users/${id}`, { skipAuth: true, cache: 'no-store' });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}

async function getUserPosts(id: string): Promise<Post[]> {
  try {
    const res = await apiFetch<(Omit<Post, 'created_at'> & { date_posted?: string })[]>(`/api/users/${id}/posts`, { skipAuth: true, cache: 'no-store' });
    return res.map(p => ({
      ...p,
      created_at: p.date_posted || (p as unknown as Post).created_at
    })) as Post[];
  } catch (error) {
    console.error("Failed to fetch user posts:", error);
    return [];
  }
}

export default async function UserPostsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getUser(resolvedParams.id);
  const posts = await getUserPosts(resolvedParams.id);
  
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

      {posts.length > 0 ? (
        posts.map((post) => (
          <article key={post.id} className="bg-white border border-brand rounded-none p-5 mb-6 group">
            <div className="flex items-start gap-4">
              
              {/* Profile Image */}
              {post.author.image_path ? (
                 <img 
                   className="rounded-full shrink-0 border border-brand object-cover" 
                   src={post.author.image_path} 
                   alt={`${post.author.username}'s profile picture`} 
                   width={48} 
                   height={48} 
                   loading="lazy" 
                 />
              ) : (
                 <div className="w-12 h-12 rounded-full shrink-0 border border-brand bg-cream flex items-center justify-center text-navy font-bold text-xl uppercase">
                   {post.author.username.charAt(0)}
                 </div>
              )}
              
              {/* Main Content Area */}
              <div className="grow">
                
                {/* Metadata Section */}
                <div className="mb-2 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-muted-grey">
                  <span className="text-navy">{post.author.username}</span>
                  <span>&middot;</span>
                  <span>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })}</span>
                </div>
                
                {/* Post Title Link */}
                <h2 className="text-2xl font-bold font-heading mt-1 mb-2 leading-tight">
                  <Link className="text-ink hover:text-gold transition-colors" href={`/post/${post.id}`}>
                    {post.title}
                  </Link>
                </h2>
                
                {/* Post Snippet */}
                <p className="text-ink leading-relaxed mb-4 text-lg line-clamp-3">
                  {post.content}
                </p>

                <Link href={`/post/${post.id}`} className="text-sm font-bold text-navy hover:text-gold uppercase tracking-wider border-b-2 border-navy hover:border-gold transition-colors">
                  Read Full Article &rarr;
                </Link>
                
              </div>
            </div>
          </article>
        ))
      ) : (
        /* Empty State Text */
        <div className="bg-cream border border-brand p-8 text-center">
          <p className="text-muted-grey italic">No posts by this user yet.</p>
        </div>
      )}
    </>
  );
}
