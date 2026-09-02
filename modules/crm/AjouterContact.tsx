"use client";

import { useState, useTransition } from "react";
import { ajouterContact } from "@/modules/crm/actions";
import { Bouton } from "@/lib/design/Bouton";
import { CHAMP, ETIQUETTE } from "@/lib/design/champs";
import type { Etape } from "@/lib/etape/types";

/**
 * L'ajout d'un contact, en panneau qui se déplie sous le bouton.
 *
 * **Le nom est le seul champ obligatoire.** Un carnet d'adresses se remplit
 * souvent avec un nom entendu au téléphone et rien d'autre : exiger l'email
 * ferait renoncer à noter le contact, ce qui est pire que de le noter à moitié.
 */
export function AjouterContact({ etapes }: { etapes: Etape[] }) {
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function envoyer(donnees: FormData) {
    demarrer(async () => {
      const resultat = await ajouterContact(donnees);
      // Une action qui réussit redirige, donc rien ne revient ici. Ce qui
      // revient est forcément un refus.
      setErreur(resultat?.erreur ?? null);
    });
  }

  if (!ouvert) {
    return <Bouton onClick={() => setOuvert(true)}>Ajouter un contact</Bouton>;
  }

  return (
    <form
      action={envoyer}
      className="w-full rounded-carte border border-bordure bg-fond p-5 shadow-carte"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={ETIQUETTE}>Nom</span>
          <input name="nom" required autoFocus className={CHAMP} />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Prénom</span>
          <input name="prenom" className={CHAMP} />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Email</span>
          <input name="email" type="email" className={CHAMP} />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Téléphone</span>
          <input name="telephone" className={CHAMP} />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Entreprise</span>
          <input name="entreprise" className={CHAMP} />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Source</span>
          <input name="source" placeholder="Bouche à oreille, Instagram..." className={CHAMP} />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Montant</span>
          <input name="montant" inputMode="decimal" className={CHAMP} />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Étape</span>
          <select name="etape_id" defaultValue={etapes[0]?.id ?? ""} className={CHAMP}>
            <option value="">Sans étape</option>
            {etapes.map((etape) => (
              <option key={etape.id} value={etape.id}>
                {etape.nom}
              </option>
            ))}
          </select>
        </label>
      </div>

      {erreur && <p className="mt-4 text-sm text-accent">{erreur}</p>}

      <div className="mt-5 flex gap-3">
        <Bouton type="submit" disabled={enCours}>
          {enCours ? "Ajout..." : "Ajouter"}
        </Bouton>
        <Bouton type="button" variante="secondaire" onClick={() => setOuvert(false)}>
          Annuler
        </Bouton>
      </div>
    </form>
  );
}
