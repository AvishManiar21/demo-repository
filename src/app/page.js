import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="glass px-8 py-10 text-center max-w-xl w-full animate-[fadeIn_600ms_ease-out]">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">Next Gallery</h1>
        <p className="text-slate-300 mb-8">A secure Supabase-backed image gallery built on Next.js.</p>
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold px-6 py-3 transition-colors"
        >
          Open Gallery
          <span className="i-heroicons-arrow-right" aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
