export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white p-8">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Page de test</h1>
        <p className="text-zinc-400">Si tu vois cette page, le déploiement Vercel fonctionne.</p>
        <div className="space-y-2 text-sm">
          <p>Environment check:</p>
          <ul className="list-disc list-inside space-y-1 text-zinc-300">
            <li>NEXTAUTH_URL: {process.env.NEXTAUTH_URL ? "✓ Configuré" : "✗ Manquant"}</li>
            <li>NEXTAUTH_SECRET: {process.env.NEXTAUTH_SECRET ? "✓ Configuré" : "✗ Manquant"}</li>
            <li>DATABASE_URL: {process.env.DATABASE_URL ? "✓ Configuré" : "✗ Manquant"}</li>
            <li>NODE_ENV: {process.env.NODE_ENV || "undefined"}</li>
          </ul>
        </div>
        <a href="/" className="inline-block mt-4 text-blue-400 hover:underline">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
