import Link from 'next/link';
import { Post } from '@/types';
import { apiFetch } from '@/lib/api';

// This function runs on the Next.js server, exactly like your old FastAPI route
async function getPosts(): Promise<Post[]> {
  try {
    // In a server component, we fetch from the backend URL
    // We pass skipAuth: true because this is public data
    const res = await apiFetch<(Omit<Post, 'created_at'> & { date_posted?: string })[]>('/api/posts', { skipAuth: true, cache: 'no-store' });
    return res.map(p => ({
      ...p,
      created_at: p.date_posted || (p as unknown as Post).created_at
    })) as Post[];
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return [];
  }
}

export default async function Home() {
  const posts = await getPosts();

  return (
    <>
      {posts.map((post) => (
        <article key={post.id} className="bg-white border border-brand rounded-none p-5 mb-6 group card-shadow-hover">
          <div className="flex items-start gap-4">
            
            {/* Profile Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {post.author.image_path ? (
               <img 
                 className="rounded-full shrink-0 border border-brand object-cover" 
                 src={post.author.image_path} 
                 alt={`${post.author.username}'s profile`} 
                 width={48} 
                 height={48} 
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
      ))}

      {/* Newsletter Capture Placeholder */}
      <div className="bg-cream border border-brand rounded-none p-8 mt-12 text-center">
        <h3 className="text-2xl font-bold font-heading text-ink mb-2">Join the Community</h3>
        <p className="text-muted-grey mb-6">Get a weekly roundup of the top news, guides, and resources.</p>
        <form className="flex flex-col sm:flex-row justify-center max-w-md mx-auto gap-2">
          <input 
            type="email" 
            placeholder="Your email address"
            className="flex-grow text-sm border border-brand px-4 py-3 focus:outline-none focus:border-ink rounded-none bg-white" 
          />
          <button 
            type="button"
            className="bg-gold text-navy hover:bg-yellow-400 px-6 py-3 rounded-none font-bold text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer"
          >
            SUBSCRIBE
          </button>
        </form>
      </div>
    </>
  );
}
