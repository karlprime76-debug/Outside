import { getUserLocale } from "@/lib/locale";

export default function CookiesPage() {
  const updated = new Date().toLocaleDateString(getUserLocale());
  return (
    <article className="prose prose-sm max-w-none text-[var(--os-fg)]">
      <h1 className="text-2xl font-black">Cookies</h1>
      <p className="text-xs text-[var(--os-muted)]">Dernière mise à jour : {updated}</p>

      <h2>Types de cookies</h2>
      <ul>
        <li>Cookies nécessaires: assurer le bon fonctionnement du site.</li>
        <li>Session/Auth: maintenir votre connexion et la sécurité.</li>
        <li>Préférences: thème (clair/sombre), langue.</li>
        <li>Analytics (si ajoutés plus tard): comprendre l’usage et améliorer le service.</li>
      </ul>

      <h2>Gérer vos préférences</h2>
      <p>Vous pouvez gérer les cookies via les paramètres de votre navigateur. Certains cookies nécessaires ne peuvent pas être désactivés.</p>

      <p className="text-xs text-[var(--os-muted)] mt-6">Ce document est une base produit à faire relire par un juriste.</p>
    </article>
  );
}
