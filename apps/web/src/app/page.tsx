export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-brand-700">
          AI Business Audit Platform
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Analyze your digital presence. Get actionable recommendations. Grow your business.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="rounded-lg bg-brand-600 px-6 py-3 text-white font-medium hover:bg-brand-700 transition-colors"
          >
            View Dashboard
          </a>
          <a
            href="/audit/new"
            className="rounded-lg border border-brand-600 px-6 py-3 text-brand-600 font-medium hover:bg-brand-50 transition-colors"
          >
            New Audit
          </a>
        </div>
      </div>
    </main>
  );
}
