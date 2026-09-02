"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Carte } from "@/lib/design/Carte";
import { Bouton } from "@/lib/design/Bouton";
import { Icone } from "@/lib/design/Icones";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import { CHAMP, ETIQUETTE } from "@/lib/design/champs";
import { formaterMontant, nomComplet, type Contact, type ValeurChamp } from "@/lib/contact/types";
import type { Etape } from "@/lib/etape/types";
import type { Champ } from "@/lib/champ/types";
import {
  deplacerContact,
  enregistrerLesValeurs,
  modifierContact,
  retirerContact,
} from "@/modules/crm/actions";

/**
 * La fiche d'un contact.
 *
 * **On lit d'abord, le stylo ouvre l'édition, un seul « Enregistrer » envoie
 * tout.** Un formulaire toujours ouvert donne l'impression que ces valeurs
 * changent sans arrêt, alors qu'on y touche à la création puis presque plus.
 *
 * **L'étape échappe au stylo**, et c'est délibéré : ce n'est pas une
 * correction, c'est un acte daté, qui écrit une ligne dans l'historique. Elle
 * se change donc d'un geste, sans passer par l'édition.
 */
export function FicheContact({
  contact,
  etapes,
  champs,
  valeurs,
  historique,
  devise,
}: {
  contact: Contact;
  etapes: Etape[];
  champs: Champ[];
  valeurs: ValeurChamp[];
  historique: { etape_nom: string; entre_le: string }[];
  devise: string;
}) {
  const [edition, setEdition] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirme, setConfirme] = useState(false);
  const [enCours, demarrer] = useTransition();
  const routeur = useRouter();

  const saisies = new Map(valeurs.map((v) => [v.champ_id, v.valeur ?? ""]));

  function enregistrer(donnees: FormData) {
    demarrer(async () => {
      const resultat = await modifierContact(contact.id, donnees);
      if (resultat.erreur) {
        setErreur(resultat.erreur);
        return;
      }

      // Les champs sur mesure partent séparément : ils vivent dans une autre
      // table, et la fiche n'a aucune raison de savoir qu'ils s'écrivent en
      // deux fois. Le formulaire est un seul geste pour qui le remplit.
      const surMesure = champs.map((champ) => ({
        champ_id: champ.id,
        valeur: String(donnees.get(`champ_${champ.id}`) ?? ""),
      }));
      const suite = await enregistrerLesValeurs(contact.id, surMesure);
      if (suite.erreur) {
        setErreur(suite.erreur);
        return;
      }

      setErreur(null);
      setEdition(false);
      routeur.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl">{nomComplet(contact)}</h1>
          <p className="mt-2 text-texte-doux">
            {[contact.entreprise, contact.source].filter(Boolean).join(" · ") ||
              "Aucune entreprise renseignée"}
          </p>
        </div>

        {/* L'étape se change d'un geste, hors édition : c'est un acte daté,
            pas une correction de saisie. */}
        <label className="flex items-center gap-3">
          <span className={`${ETIQUETTE} mb-0`}>Étape</span>
          <select
            value={contact.etape_id ?? ""}
            disabled={enCours}
            onChange={(e) =>
              demarrer(async () => {
                await deplacerContact(contact.id, e.target.value || null);
                routeur.refresh();
              })
            }
            className={CHAMP.replace("w-full", "w-auto")}
          >
            <option value="">Sans étape</option>
            {etapes.map((etape) => (
              <option key={etape.id} value={etape.id}>
                {etape.nom}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!edition ? (
        <Carte className="mt-6">
          <div className="flex items-start justify-between gap-4">
            <MicroLibelle>Sa fiche</MicroLibelle>
            <button
              type="button"
              onClick={() => setEdition(true)}
              aria-label="Modifier cette fiche"
              className="text-texte-doux transition-colors duration-200 hover:text-accent"
            >
              <Icone nom="stylo" className="h-4 w-4" />
            </button>
          </div>

          <dl className="mt-5 flex flex-col gap-3 text-sm">
            <Ligne intitule="Email" valeur={contact.email} />
            <Ligne intitule="Téléphone" valeur={contact.telephone} />
            <Ligne intitule="Entreprise" valeur={contact.entreprise} />
            <Ligne intitule="Source" valeur={contact.source} />
            <Ligne intitule="Montant" valeur={formaterMontant(contact.montant, devise)} />
            {champs.map((champ) => (
              <Ligne key={champ.id} intitule={champ.libelle} valeur={saisies.get(champ.id) ?? ""} />
            ))}
            <Ligne intitule="Notes" valeur={contact.notes} />
          </dl>
        </Carte>
      ) : (
        <Carte className="mt-6">
          <form action={enregistrer}>
            <MicroLibelle>Sa fiche</MicroLibelle>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Champ2 nom="nom" intitule="Nom" defaut={contact.nom} requis />
              <Champ2 nom="prenom" intitule="Prénom" defaut={contact.prenom} />
              <Champ2 nom="email" intitule="Email" defaut={contact.email} type="email" />
              <Champ2 nom="telephone" intitule="Téléphone" defaut={contact.telephone} />
              <Champ2 nom="entreprise" intitule="Entreprise" defaut={contact.entreprise} />
              <Champ2 nom="source" intitule="Source" defaut={contact.source} />
              <Champ2
                nom="montant"
                intitule="Montant"
                defaut={contact.montant === null ? "" : String(contact.montant)}
              />
            </div>

            {champs.length > 0 && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {champs.map((champ) => (
                  <ChampSurMesure
                    key={champ.id}
                    champ={champ}
                    defaut={saisies.get(champ.id) ?? ""}
                  />
                ))}
              </div>
            )}

            <label className="mt-5 block">
              <span className={ETIQUETTE}>Notes</span>
              <textarea
                name="notes"
                rows={4}
                defaultValue={contact.notes ?? ""}
                className={CHAMP}
              />
            </label>

            {erreur && <p className="mt-4 text-sm text-accent">{erreur}</p>}

            <div className="mt-5 flex gap-3">
              <Bouton type="submit" disabled={enCours}>
                {enCours ? "Enregistrement..." : "Enregistrer"}
              </Bouton>
              <Bouton
                type="button"
                variante="secondaire"
                onClick={() => {
                  setEdition(false);
                  setErreur(null);
                }}
              >
                Annuler
              </Bouton>
            </div>
          </form>
        </Carte>
      )}

      <Carte ton="calme" className="mt-5 shadow-douce">
        <MicroLibelle>Son parcours</MicroLibelle>
        {historique.length === 0 ? (
          <p className="mt-3 text-sm text-texte-doux">
            Ce contact n&apos;a encore été posé sur aucune étape.
          </p>
        ) : (
          <ol className="mt-3 flex flex-col gap-2 text-sm">
            {historique.map((passage, rang) => (
              <li key={`${passage.entre_le}-${rang}`} className="flex justify-between gap-4">
                <span>{passage.etape_nom}</span>
                <span className="shrink-0 text-texte-doux tabular-nums">
                  {new Date(passage.entre_le).toLocaleDateString("fr-FR")}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Carte>

      <div className="mt-8 flex items-center gap-4 text-[13px]">
        {confirme ? (
          <>
            <span className="text-texte-doux">
              Ce contact et tout son parcours partent définitivement.
            </span>
            <button
              type="button"
              disabled={enCours}
              onClick={() => demarrer(async () => void (await retirerContact(contact.id)))}
              className="text-accent hover:underline disabled:opacity-60"
            >
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setConfirme(false)}
              className="text-texte-doux hover:text-texte"
            >
              Annuler
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirme(true)}
            className="text-texte-doux transition-colors duration-200 hover:text-accent"
          >
            Retirer ce contact
          </button>
        )}
      </div>
    </>
  );
}

function Ligne({ intitule, valeur }: { intitule: string; valeur: string | null }) {
  return (
    <div className="flex justify-between gap-6 border-b border-bordure pb-2 last:border-0">
      <dt className="shrink-0 text-texte-doux">{intitule}</dt>
      <dd className="text-right break-words">{valeur || "Non renseigné"}</dd>
    </div>
  );
}

function Champ2({
  nom,
  intitule,
  defaut,
  type = "text",
  requis = false,
}: {
  nom: string;
  intitule: string;
  defaut: string | null;
  type?: string;
  requis?: boolean;
}) {
  return (
    <label className="block">
      <span className={ETIQUETTE}>{intitule}</span>
      <input
        name={nom}
        type={type}
        required={requis}
        defaultValue={defaut ?? ""}
        className={CHAMP}
      />
    </label>
  );
}

/** Un champ sur mesure, dessiné selon son type. */
function ChampSurMesure({ champ, defaut }: { champ: Champ; defaut: string }) {
  const nom = `champ_${champ.id}`;

  return (
    <label className="block">
      <span className={ETIQUETTE}>{champ.libelle}</span>
      {champ.type === "texte_long" ? (
        <textarea name={nom} rows={3} defaultValue={defaut} className={CHAMP} />
      ) : champ.type === "choix" ? (
        <select name={nom} defaultValue={defaut} className={CHAMP}>
          <option value="">Sans réponse</option>
          {(champ.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={nom}
          type={champ.type === "date" ? "date" : champ.type === "nombre" ? "number" : "text"}
          defaultValue={defaut}
          className={CHAMP}
        />
      )}
      {champ.aide && <span className="mt-1 block text-[13px] text-texte-doux">{champ.aide}</span>}
    </label>
  );
}
