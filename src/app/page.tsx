import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 sm:text-7xl">
          OUTSIDE
        </h1>
        <p className="mt-4 text-xl font-medium text-outside-600">
          The world is outside.
        </p>
        <p className="mt-6 max-w-lg text-lg text-zinc-600">
          Find what&apos;s happening around you. Right now. Plans, places, and people near you.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-full bg-outside-600 px-8 text-base font-semibold text-white shadow-sm hover:bg-outside-700 transition-colors"
          >
            I&apos;m outside
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 px-8 text-base font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Cities */}
      <section className="bg-zinc-50 px-6 py-16">
        <h2 className="text-center text-2xl font-semibold text-zinc-900">
          Available cities
        </h2>
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
          {["Cotonou", "Abidjan", "Paris", "Lagos", "New York", "Dubai"].map((city) => (
            <span
              key={city}
              className="rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-700 shadow-sm border border-zinc-200"
            >
              OUTSIDE {city}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 px-6 py-8 text-center text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} OUTSIDE. All rights reserved.
      </footer>
    </div>
  );
}
