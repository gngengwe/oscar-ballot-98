import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center">
        <span className="text-6xl block mb-6">🎬</span>
        <h1 className="text-4xl font-bold text-cinema-100 mb-2">404</h1>
        <p className="text-cinema-400 mb-8">
          This scene was cut from the final edit.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-lg bg-gold-600 text-white font-semibold hover:bg-gold-500 transition-all"
        >
          Back to the Red Carpet
        </Link>
      </div>
    </div>
  );
}
