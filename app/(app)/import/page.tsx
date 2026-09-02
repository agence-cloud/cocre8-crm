import Link from "next/link";
import { exigerCompte } from "@/lib/auth/compte";
import { lireEtapes } from "@/lib/etape/requetes";
import { ImportCsv } from "@/modules/crm/ImportCsv";

export default async function PageImport() {
  await exigerCompte();
  const etapes = await lireEtapes();

  return (
    <>
      <Link href="/contacts" className="text-sm text-texte-doux hover:text-texte">
        Retour à tes contacts
      </Link>

      <h1 className="mt-4 text-4xl">
        Importer un <span className="text-accent">fichier</span>
      </h1>
      <p className="mt-2 max-w-2xl text-texte-doux">
        Ton fichier existant, celui que tu tiens dans un tableur. Rien
        n&apos;est écrasé : un contact dont l&apos;email est déjà chez toi est
        écarté, et l&apos;écran te dit lesquels.
      </p>

      <ImportCsv etapes={etapes} />
    </>
  );
}
