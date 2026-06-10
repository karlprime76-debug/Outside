import { getUserLocale } from "@/lib/locale";

export default function TermsPage() {
  const updated = new Date().toLocaleDateString(getUserLocale());
  return (
    <article className="prose prose-sm max-w-none text-[var(--os-fg)] prose-headings:text-[var(--os-fg)] prose-p:text-[var(--os-fg)]">
      <h1 className="text-2xl font-black">Conditions d’utilisation</h1>
      <p className="text-xs text-[var(--os-muted)]">Dernière mise à jour : {updated}</p>

      <h2>1. Présentation de OUTSIDE</h2>
      <p>OUTSIDE est une application sociale mobile-first permettant de découvrir des plans, publier des moments, lancer des lives et discuter avec des amis.</p>

      <h2>2. Acceptation des conditions</h2>
      <p>En créant un compte ou en utilisant OUTSIDE, vous acceptez ces conditions. Si vous n’acceptez pas, n’utilisez pas le service.</p>

      <h2>3. Âge minimum : 18 ans</h2>
      <p>Vous devez avoir au moins 18 ans pour créer un compte OUTSIDE. Les utilisateurs de moins de 18 ans ne sont pas autorisés à créer un compte.</p>

      <h2>4. Création de compte</h2>
      <p>Vous devez fournir des informations exactes et à jour. OUTSIDE peut vérifier certaines informations (par exemple l’identité) pour des raisons de confiance et de sécurité.</p>

      <h2>5. Exactitude des informations</h2>
      <p>Vous êtes responsable de l’exactitude des informations de votre profil et de vos publications.</p>

      <h2>6. Utilisation des plans, moments, lives et messages</h2>
      <p>Respectez les autres et les lois applicables. Les plans, moments, lives et DM doivent refléter des activités réelles et respecter la vie privée d’autrui.</p>

      <h2>7. Comportements interdits</h2>
      <ul>
        <li>Harcèlement, menaces, incitation à la haine, spam, arnaques, usurpation d’identité, faux profils.</li>
        <li>Contenus sexuels explicites, exploitation de mineurs, violence, partage de position privée d’autrui.</li>
      </ul>

      <h2>8. Contenus utilisateur</h2>
      <p>Vous conservez vos droits sur vos contenus. Vous accordez à OUTSIDE une licence limitée pour héberger et diffuser vos contenus dans le cadre du service.</p>

      <h2>9. Signalements et modération</h2>
      <p>Les utilisateurs peuvent signaler des contenus ou comportements contraires aux règles. OUTSIDE peut enquêter et prendre des mesures appropriées.</p>

      <h2>10. Suspension ou suppression de compte</h2>
      <p>OUTSIDE peut suspendre ou supprimer un compte en cas de violation grave ou répétée des règles.</p>

      <h2>11. OUTSIDE Pro</h2>
      <p>Les comptes professionnels peuvent publier des événements. Des conditions spécifiques peuvent s’appliquer.</p>

      <h2>12. Limitation de responsabilité</h2>
      <p>OUTSIDE est fourni « en l’état ». Nous ne garantissons pas l’absence d’erreurs. Dans les limites permises par la loi, notre responsabilité est limitée.</p>

      <h2>13. Évolution du service</h2>
      <p>Le service peut évoluer. Nous pouvons modifier ces conditions. En cas de changement important, une notification raisonnable sera fournie.</p>

      <h2>14. Contact</h2>
      <p>Contactez-nous via l’app ou par email pour toute question relative aux présentes conditions.</p>

      <p className="text-xs text-[var(--os-muted)] mt-6">Ce document est une base produit à faire relire par un juriste.</p>
    </article>
  );
}
