import { getUserLocale } from "@/lib/locale";

export default function CommunityGuidelinesPage() {
  const updated = new Date().toLocaleDateString(getUserLocale());
  return (
    <article className="prose prose-sm max-w-none text-[var(--os-fg)]">
      <h1 className="text-2xl font-black">Règles communautaires</h1>
      <p className="text-xs text-[var(--os-muted)]">Dernière mise à jour : {updated}</p>

      <h2>Interdit</h2>
      <ul>
        <li>Harcèlement, menaces.</li>
        <li>Contenus sexuels explicites, exploitation de mineurs.</li>
        <li>Incitation à la haine.</li>
        <li>Faux profils trompeurs, usurpation d’identité.</li>
        <li>Spam, arnaques.</li>
        <li>Violence.</li>
        <li>Partage de position privée d’autrui.</li>
        <li>Faux plans.</li>
      </ul>

      <h2>Encouragé</h2>
      <ul>
        <li>Respect et bienveillance.</li>
        <li>Plans réels et lieux publics.</li>
        <li>Prudence, respect de la vie privée.</li>
        <li>Signalement des abus.</li>
      </ul>

      <p className="text-xs text-[var(--os-muted)] mt-6">Ces règles évoluent pour protéger la communauté. Merci de les respecter.</p>
    </article>
  );
}
