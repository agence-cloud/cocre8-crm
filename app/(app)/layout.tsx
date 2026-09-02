import { cookies } from "next/headers";
import { exigerCompte } from "@/lib/auth/compte";
import { NavigationLaterale } from "@/lib/design/NavigationLaterale";

/**
 * La coquille de l'outil : la barre à gauche, le contenu à droite.
 *
 * Un groupe de routes entre parenthèses plutôt qu'un dossier : les adresses
 * restent `/contacts` et `/pipe`, sans préfixe. La connexion et l'écran
 * d'installation vivent en dehors, ils n'ont pas de barre.
 */
const LIENS = [
  { libelle: "Mes contacts", href: "/contacts", icone: "clients" as const },
  { libelle: "Mon pipe", href: "/pipe", icone: "crm" as const },
  { libelle: "Mes chiffres", href: "/statistiques", icone: "statistiques" as const },
  { libelle: "Réglages", href: "/reglages", icone: "reglages" as const },
];

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const compte = await exigerCompte();
  const repliee = (await cookies()).get("nav_repliee")?.value === "1";

  return (
    <div className="flex min-h-screen">
      <NavigationLaterale liens={LIENS} nom={compte.nom} zone="Ton CRM" repliee={repliee} />
      {/* min-w-0 est indispensable : un enfant flex a min-width:auto par
          défaut, donc sans lui cette zone refuse de rétrécir sous la largeur
          de son contenu, et le débordement du pipe emporte toute la page au
          lieu de rester dans son propre conteneur. */}
      <div className="flex min-w-0 flex-1 flex-col bg-fond-alt">
        <main className="min-w-0 flex-1 p-10">{children}</main>
      </div>
    </div>
  );
}
