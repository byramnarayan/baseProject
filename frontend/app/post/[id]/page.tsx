import Link from 'next/link';
import { Post } from '@/types';
import { apiFetch } from '@/lib/api';
import PostActions from '@/components/PostActions';

async function getPost(id: string): Promise<Post | null> {
  try {
    // The backend uses date_posted for the response, let's map it if needed or assume it's created_at
    const res = await apiFetch<Omit<Post, 'created_at'> & { date_posted?: string }>(`/api/posts/${id}`, { skipAuth: true, cache: 'no-store' });
    // Normalize date_posted to created_at
    return {
      ...res,
      created_at: res.date_posted || (res as unknown as Post).created_at
    } as Post;
  } catch (error) {
    console.error("Failed to fetch post:", error);
    return null;
  }
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.id);
  
  if (!post) {
    return (
      <div className="bg-cream border border-brand p-8 text-center mt-8">
        <h2 className="text-2xl font-bold font-heading text-ink mb-2">Post not found</h2>
        <p className="text-muted-grey mb-4">The post you are looking for does not exist or has been deleted.</p>
        <Link href="/" className="text-navy font-bold hover:text-gold transition-colors">&larr; Back to Home</Link>
      </div>
    );
  }

  return (
    <article className="bg-white border border-brand rounded-none p-6 md:p-8 mb-8">
      <div className="flex items-center gap-4 mb-8 border-b border-brand pb-6">

        {/* Profile Image */}
        {post.author.image_path ? (
           <img 
             className="rounded-full shrink-0 border border-brand object-cover" 
             src={post.author.image_path} 
             alt={`${post.author.username}'s profile picture`} 
             width={64} 
             height={64} 
             loading="lazy" 
           />
        ) : (
           <div className="w-16 h-16 rounded-full shrink-0 border border-brand bg-cream flex items-center justify-center text-navy font-bold text-2xl uppercase">
             {post.author.username.charAt(0)}
           </div>
        )}

        {/* Author and Meta */}
        <div className="grow">
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-ink leading-tight mb-2">{post.title}</h1>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-muted-grey">
            <Link className="hover:text-gold transition-colors text-navy" href={`/user/${post.author.id}`}>
              {post.author.username}
            </Link>
            <span>&middot;</span>
            <span>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })}</span>
            <span>&middot;</span>
            <span className="text-green-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Verified Author
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="prose max-w-none">
        <p className="text-ink leading-relaxed text-lg mb-8 whitespace-pre-wrap">{post.content}</p>
      </div>

      <PostActions 
         postId={post.id} 
         ownerId={post.user_id} 
         initialTitle={post.title} 
         initialContent={post.content} 
      />
    </article>
  );
}
