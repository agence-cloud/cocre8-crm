import { exigerCompte } from "@/lib/auth/compte";
import { lireEtapes } from "@/lib/etape/requetes";
import { lireChamps } from "@/lib/champ/requetes";
import { lireReglages } from "@/lib/reglages/requetes";
import {
  ReglagesChamps,
  ReglagesEtapes,
  ReglagesOutil,
} from "@/modules/crm/Reglages";
import { MonMotDePasse } from "@/lib/design/MonMotDePasse";

export default async function PageReglages() {
  await exigerCompte();

  const [reglages, etapes, champs] = await Promise.all([
    lireReglages(),
    lireEtapes(),
    // Les inactifs aussi : c'est ici qu'on les réactive.
    lireChamps(false),
  ]);

  return (
    <>
      <h1 className="text-4xl">
        Tes <span className="text-accent">réglages</span>
      </h1>
      <p className="mt-2 text-texte-doux">
        Le nom de ton outil, tes étapes, et ce que tu ajoutes aux fiches.
      </p>

      <div className="mt-8 max-w-2xl">
        <ReglagesOutil reglages={reglages} />
        <ReglagesEtapes etapes={etapes} />
        <ReglagesChamps champs={champs} />
        <MonMotDePasse />
      </div>
    </>
  );
}
