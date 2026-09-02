import Link from "next/link";
import { exigerCompte } from "@/lib/auth/compte";
import { lireContacts } from "@/lib/contact/requetes";
import { lireEtapes } from "@/lib/etape/requetes";
import { lireReglages } from "@/lib/reglages/requetes";
import { ListeContacts } from "@/modules/crm/ListeContacts";
import { AjouterContact } from "@/modules/crm/AjouterContact";
import { Bouton } from "@/lib/design/Bouton";

export default async function PageContacts() {
  // Chaque page se garde elle-même, le layout ne suffit pas.
  await exigerCompte();

  const [contacts, etapes, reglages] = await Promise.all([
    lireContacts(),
    lireEtapes(),
    lireReglages(),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl">
            Tes <span className="text-accent">contacts</span>
          </h1>
          <p className="mt-2 text-texte-doux">Tout le monde, et où chacun en est.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/import">
            <Bouton variante="secondaire">Importer un fichier</Bouton>
          </Link>
          <AjouterContact etapes={etapes} />
        </div>
      </div>

      <ListeContacts contacts={contacts} etapes={etapes} devise={reglages.devise} />
    </>
  );
}
