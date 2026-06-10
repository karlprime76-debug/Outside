import { getUserLocale } from "@/lib/locale";

export default function LegalIndexPage() {
  const updated = new Date().toLocaleDateString(getUserLocale());
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Mentions légales</h1>
        <p className="text-xs text-[var(--os-muted)]">Dernière mise à jour : {updated}</p>
      </div>
      <p className="text-sm text-[var(--os-fg)]">
        Cette section regroupe les documents légaux de OUTSIDE. Ces textes servent de base produit et doivent être
        relus par un juriste avant lancement officiel.
      </p>
      <ul className="list-disc pl-5 text-sm text-[var(--os-fg)] space-y-2">
        <li><a className="text-outside-600 hover:underline" href="/legal/terms">Conditions d’utilisation</a></li>
        <li><a className="text-outside-600 hover:underline" href="/legal/privacy">Politique de confidentialité</a></li>
        <li><a className="text-outside-600 hover:underline" href="/legal/community-guidelines">Règles communautaires</a></li>
        <li><a className="text-outside-600 hover:underline" href="/legal/cookies">Cookies</a></li>
      </ul>
      <p className="text-xs text-[var(--os-muted)]">
        Ce contenu n’est pas un avis juridique. Il doit être adapté à votre contexte et validé par un professionnel.
      </p>
    </div>
  );
}
