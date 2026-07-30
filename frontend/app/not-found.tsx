import Link from 'next/link';

export default function NotFound() {
  return (
    <article className="bg-white border border-brand rounded-none py-12 px-8 mb-4 text-center mt-12">
      <h1 className="text-6xl font-bold font-heading mb-4 text-navy">
        404
      </h1>
      <h2 className="text-2xl font-bold font-heading mb-6 text-ink uppercase tracking-wider">
        Page Not Found
      </h2>
      <p className="text-muted-grey leading-relaxed max-w-md mx-auto mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="inline-block bg-navy text-white hover:bg-gold hover:text-navy px-6 py-3 rounded-none font-bold text-sm tracking-wide transition-colors">
        RETURN HOME
      </Link>
    </article>
  );
}
