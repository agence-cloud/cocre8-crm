import { exigerCompte } from "@/lib/auth/compte";
import { lireContacts } from "@/lib/contact/requetes";
import { lireEtapes } from "@/lib/etape/requetes";
import { lireReglages } from "@/lib/reglages/requetes";
import { Pipe } from "@/modules/crm/Pipe";
import { Carte } from "@/lib/design/Carte";

export default async function PagePipe() {
  await exigerCompte();

  const [contacts, etapes, reglages] = await Promise.all([
    lireContacts(),
    lireEtapes(),
    lireReglages(),
  ]);

  const sansEtape = contacts.filter((contact) => contact.etape_id === null);

  return (
    <>
      <h1 className="text-4xl">
        Ton <span className="text-accent">pipe</span>
      </h1>
      <p className="mt-2 text-texte-doux">
        Fais glisser une carte d&apos;une colonne à l&apos;autre. Chaque passage
        est daté, c&apos;est ce qui nourrit tes chiffres.
      </p>

      {etapes.length === 0 ? (
        <Carte ton="calme" className="mt-6">
          <p className="text-sm text-texte-doux">
            Aucune étape. Va dans tes réglages en poser au moins une.
          </p>
        </Carte>
      ) : (
        <Pipe contacts={contacts} etapes={etapes} devise={reglages.devise} />
      )}

      {/* Les contacts sans étape ne sont dans aucune colonne : sans ce
          rappel, ils disparaîtraient de l'écran qui sert justement à voir
          tout le monde. C'est le cas d'un fichier fraîchement importé. */}
      {sansEtape.length > 0 && (
        <Carte ton="calme" className="mt-2">
          <p className="text-sm text-texte-doux">
            {sansEtape.length} contact{sansEtape.length > 1 ? "s" : ""} sans étape
            {sansEtape.length > 1 ? " ne sont" : " n'est"} dans aucune colonne. Ouvre
            {sansEtape.length > 1 ? "-les" : "-le"} depuis tes contacts pour
            {sansEtape.length > 1 ? " les" : " le"} poser dans le pipe.
          </p>
        </Carte>
      )}
    </>
  );
}
