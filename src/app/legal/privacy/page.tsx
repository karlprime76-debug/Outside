import { getUserLocale } from "@/lib/locale";

export default function PrivacyPage() {
  const updated = new Date().toLocaleDateString(getUserLocale());
  return (
    <article className="prose prose-sm max-w-none text-[var(--os-fg)]">
      <h1 className="text-2xl font-black">Politique de confidentialité</h1>
      <p className="text-xs text-[var(--os-muted)]">Dernière mise à jour : {updated}</p>

      <h2>1. Données collectées</h2>
      <ul>
        <li>Compte: nom, email, mot de passe chiffré, âge confirmé (18+), préférences.</li>
        <li>Profil: bio, photo, badges.</li>
        <li>Pays/ville: ville principale et ville active.</li>
        <li>Contenus publiés: plans, moments, lives.</li>
        <li>Messages privés (DM): contenus échangés entre utilisateurs.</li>
        <li>Signalements: informations fournies lors d’un signalement.</li>
        <li>Données techniques: logs, identifiants techniques, métriques d’usage.</li>
      </ul>

      <h2>2. Utilisation des données</h2>
      <ul>
        <li>Fournir le service et personnaliser l’expérience.</li>
        <li>Suggestions (plans, amis, lieux) basées sur la ville.</li>
        <li>Sécurité et prévention des abus.</li>
        <li>Modération des contenus et comportements.</li>
        <li>Notifications pertinentes.</li>
      </ul>

      <h2>3. Localisation</h2>
      <p>OUTSIDE utilise la ville/pays ou la ville active pour adapter le contenu. La position exacte n’est jamais affichée publiquement.</p>

      <h2>4. Messages privés</h2>
      <p>Les DM sont privés entre utilisateurs. En cas de signalement, d’obligation légale ou de risque grave, ils peuvent être analysés par l’équipe de modération conformément à la loi.</p>

      <h2>5. Documents d’identité</h2>
      <p>Si une vérification d’identité est proposée, les documents ne sont pas publics et sont utilisés uniquement pour la vérification.</p>

      <h2>6. Durée de conservation</h2>
      <p>Les données sont conservées le temps nécessaire pour fournir le service, respecter nos obligations légales et assurer la sécurité.</p>

      <h2>7. Suppression de compte</h2>
      <p>Vous pouvez demander la suppression de votre compte. Certaines données peuvent être conservées si la loi l’exige ou pour des raisons de sécurité (ex: abus).</p>

      <h2>8. Sécurité</h2>
      <p>Nous mettons en œuvre des mesures de sécurité adaptées. Aucune méthode n’étant infaillible, nous améliorons en continu la protection des données.</p>

      <h2>9. Contact</h2>
      <p>Contactez-nous à erosiahelp@hotmail.com pour toute question relative à cette politique.</p>

      <p className="text-xs text-[var(--os-muted)] mt-6">Ce document est une base produit à faire relire par un juriste.</p>
    </article>
  );
}
