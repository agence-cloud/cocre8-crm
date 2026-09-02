import { exigerCompte } from "@/lib/auth/compte";
import { lireContacts } from "@/lib/contact/requetes";
import { lireEtapes } from "@/lib/etape/requetes";
import { lireReglages } from "@/lib/reglages/requetes";
import { chiffres, lireEntreesParMois } from "@/lib/stats/requetes";
import { formaterMontant } from "@/lib/contact/types";
import { Entonnoir } from "@/modules/crm/Entonnoir";
import { Entrees } from "@/modules/crm/Entrees";
import { Carte } from "@/lib/design/Carte";
import { CarteStat } from "@/lib/design/CarteStat";
import { MicroLibelle } from "@/lib/design/MicroLibelle";

export default async function PageStatistiques() {
  await exigerCompte();

  const [contacts, etapes, entrees, reglages] = await Promise.all([
    lireContacts(),
    lireEtapes(),
    lireEntreesParMois(),
    lireReglages(),
  ]);

  const bilan = chiffres(contacts, etapes);

  return (
    <>
      <h1 className="text-4xl">
        Tes <span className="text-accent">chiffres</span>
      </h1>
      <p className="mt-2 text-texte-doux">
        Ce que porte ton pipe, et ce qui y entre. Tout se calcule sur les
        passages d&apos;étape, pas sur les dates de création.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CarteStat
          icone="clients"
          libelle="Contacts"
          valeur={bilan.total}
          detail={`${bilan.enCours} en cours`}
        />
        <CarteStat
          icone="crm"
          libelle="Ton pipe"
          valeur={formaterMontant(bilan.pipe, reglages.devise) || "0"}
          detail="Ce que pèsent les affaires ouvertes"
        />
        <CarteStat
          icone="coche"
          libelle="Gagné"
          valeur={formaterMontant(bilan.gagne, reglages.devise) || "0"}
          detail={`${bilan.gagnes} affaire${bilan.gagnes > 1 ? "s" : ""}`}
        />
        <CarteStat
          icone="statistiques"
          libelle="Conversion"
          /* Nul tant que rien n'est clos : un taux à 0 % se lit comme un
             échec, alors qu'il n'y a simplement rien à mesurer. */
          valeur={bilan.conversion === null ? "Pas encore" : `${bilan.conversion} %`}
          detail={
            bilan.conversion === null
              ? "Aucune affaire close"
              : `Sur ${bilan.gagnes + bilan.perdus} affaires closes`
          }
        />
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
        <Carte>
          <MicroLibelle>Où en est chacun</MicroLibelle>
          {etapes.length === 0 ? (
            <p className="mt-3 text-sm text-texte-doux">Aucune étape réglée.</p>
          ) : (
            <Entonnoir contacts={contacts} etapes={etapes} devise={reglages.devise} />
          )}
        </Carte>

        <Carte>
          <MicroLibelle>Entrés dans ton pipe, par mois</MicroLibelle>
          <Entrees entrees={entrees} />
        </Carte>
      </div>
    </>
  );
}
