import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerCompte } from "@/lib/auth/compte";
import { lireContact, lireValeurs, lireHistorique } from "@/lib/contact/requetes";
import { lireEtapes } from "@/lib/etape/requetes";
import { lireChamps } from "@/lib/champ/requetes";
import { lireReglages } from "@/lib/reglages/requetes";
import { FicheContact } from "@/modules/crm/FicheContact";

export default async function PageContact({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigerCompte();
  const { id } = await params;

  const contact = await lireContact(id);
  if (!contact) notFound();

  const [etapes, champs, valeurs, historique, reglages] = await Promise.all([
    lireEtapes(),
    lireChamps(),
    lireValeurs(id),
    lireHistorique(id),
    lireReglages(),
  ]);

  return (
    <>
      <Link href="/contacts" className="text-sm text-texte-doux hover:text-texte">
        Retour à tes contacts
      </Link>
      <div className="mt-4">
        <FicheContact
          contact={contact}
          etapes={etapes}
          champs={champs}
          valeurs={valeurs}
          historique={historique}
          devise={reglages.devise}
        />
      </div>
    </>
  );
}
