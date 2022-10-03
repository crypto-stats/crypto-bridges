import Link from 'next/link';

export default function ErrorPage() {
  return (
    <div>
      <h1>404</h1>
      <p>Your&apos;re in the wrong place!</p>
      <p>Let&apos;s help you find your way <Link href="/"><a>home</a></Link>.</p>
    </div>
  );
}
