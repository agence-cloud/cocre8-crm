import type { Metadata } from "next";
import { lireNomDeLOutil } from "@/lib/reglages/requetes";
import { ProgrammeProvider } from "@/lib/design/LogoProgramme";
import "./globals.css";

/**
 * Aucune police n'est chargée : la pile système, définie dans `globals.css`.
 * Une police prise chez Google ferait partir un appel vers un tiers depuis le
 * CRM de quelqu'un, pour un gain que personne ne verrait.
 */

/**
 * Le nom de l'outil est un réglage, donc le titre de l'onglet aussi.
 *
 * La lecture passe par une fonction de la base qui ne rend que ce nom : le
 * reste des réglages n'est pas lisible sans compte.
 */
export async function generateMetadata(): Promise<Metadata> {
  const nom = await lireNomDeLOutil();
  return { title: nom, description: "Tes contacts, leurs étapes, et tes chiffres." };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nom = await lireNomDeLOutil();

  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ProgrammeProvider nom={nom}>{children}</ProgrammeProvider>
      </body>
    </html>
  );
}
