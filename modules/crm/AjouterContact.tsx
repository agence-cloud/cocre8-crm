"use client";

import { useState, useTransition } from "react";
import { ajouterContact } from "@/modules/crm/actions";
import { Bouton } from "@/lib/design/Bouton";
import { Modale } from "@/lib/design/Modale";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import { CHAMP, ETIQUETTE } from "@/lib/design/champs";
import type { Etape } from "@/lib/etape/types";

/**
 * L'ajout d'un contact, en fenêtre posée par dessus l'écran.
 *
 * **Le nom est le seul champ obligatoire.** Un carnet d'adresses se remplit
 * souvent avec un nom entendu au téléphone et rien d'autre : exiger l'email
 * ferait renoncer à noter le contact, ce qui est pire que de le noter à
 * moitié. L'astérisque le dit, et c'est le seul de la fenêtre.
 *
 * **Deux groupes, et ils racontent deux choses différentes** : qui est cette
 * personne, puis où elle en est avec toi. Les huit champs se suivaient
 * auparavant d'un trait, si bien que l'étape et le montant, qui décident de
 * la colonne où la fiche atterrit, se lisaient comme deux cases de plus.
 *
 * **Le prénom passe devant le nom.** C'est l'ordre dans lequel on les dit, et
 * le formulaire les demandait dans l'autre.
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
    <Modale
      titre="Nouveau contact"
      sous_titre="Son nom suffit. Tout le reste se complète plus tard, sur sa fiche."
      onFermer={() => setOuvert(false)}
    >
      <form action={envoyer}>
        <div className="px-6 py-6">
          <MicroLibelle>Qui c&apos;est</MicroLibelle>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={ETIQUETTE}>Prénom</span>
              <input name="prenom" className={CHAMP} />
            </label>
            <label className="block">
              <span className={ETIQUETTE}>
                Nom <span className="text-accent">*</span>
              </span>
              <input name="nom" required className={CHAMP} />
            </label>
            <label className="block">
              <span className={ETIQUETTE}>Email</span>
              <input name="email" type="email" className={CHAMP} />
            </label>
            <label className="block">
              <span className={ETIQUETTE}>Téléphone</span>
              <input name="telephone" className={CHAMP} />
            </label>
            <label className="block sm:col-span-2">
              <span className={ETIQUETTE}>Entreprise</span>
              <input name="entreprise" className={CHAMP} />
            </label>
          </div>

          <div className="mt-7 border-t border-bordure pt-6">
            <MicroLibelle>Où il en est</MicroLibelle>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              <label className="block">
                <span className={ETIQUETTE}>Montant de l&apos;affaire</span>
                <input name="montant" inputMode="decimal" placeholder="0" className={CHAMP} />
              </label>
              <label className="block sm:col-span-2">
                <span className={ETIQUETTE}>Source</span>
                <input
                  name="source"
                  placeholder="Bouche à oreille, Instagram..."
                  className={CHAMP}
                />
                <span className="mt-1.5 block text-[12px] text-texte-doux/65">
                  D&apos;où il vient. C&apos;est ce qui nourrit tes chiffres d&apos;entrées.
                </span>
              </label>
            </div>
          </div>

          {erreur && <p className="mt-5 text-sm text-accent">{erreur}</p>}
        </div>

        {/* Les actions dans leur propre bande, détachée du dernier champ : sur
            une fenêtre qui défile, elles restaient sinon collées à la source
            et se lisaient comme si elles lui appartenaient. */}
        <div className="flex gap-3 border-t border-bordure bg-fond-alt px-6 py-5">
          <Bouton type="submit" disabled={enCours}>
            {enCours ? "Ajout..." : "Ajouter le contact"}
          </Bouton>
          <Bouton type="button" variante="secondaire" onClick={() => setOuvert(false)}>
            Annuler
          </Bouton>
        </div>
      </form>
    </Modale>
  );
}
