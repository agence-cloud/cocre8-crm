"use client";

import { useActionState, useState } from "react";
import { Carte } from "@/lib/design/Carte";
import { Bouton } from "@/lib/design/Bouton";
import { Icone } from "@/lib/design/Icones";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import { CHAMP, CHAMP_LIGNE, ETIQUETTE } from "@/lib/design/champs";
import {
  enregistrerLesChamps,
  enregistrerLesEtapes,
  enregistrerLesReglages,
  type EtatListe,
} from "@/modules/crm/actions-reglages";
import { ISSUES, type Etape } from "@/lib/etape/types";
import { TYPES, type Champ } from "@/lib/champ/types";
import type { Reglages as TypeReglages } from "@/lib/reglages/types";

const INITIAL: EtatListe = { erreur: null, enregistre: false };

/* ------------------------------------------------------------------ */
/*  Les pièces communes aux trois blocs                                */
/* ------------------------------------------------------------------ */

function Pied({
  enCours,
  etat,
  onAnnuler,
}: {
  enCours: boolean;
  etat: EtatListe;
  onAnnuler: () => void;
}) {
  return (
    <>
      {etat.erreur && <p className="mt-4 text-sm text-accent">{etat.erreur}</p>}
      <div className="mt-5 flex gap-3">
        <Bouton type="submit" disabled={enCours}>
          {enCours ? "Enregistrement..." : "Enregistrer"}
        </Bouton>
        <Bouton type="button" variante="secondaire" onClick={onAnnuler}>
          Annuler
        </Bouton>
      </div>
    </>
  );
}

function Retirer({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Retirer cette ligne"
      className="shrink-0 text-texte-doux transition-colors duration-200 hover:text-accent"
    >
      <Icone nom="croix" className="h-4 w-4" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Le nom de l'outil et la devise                                     */
/* ------------------------------------------------------------------ */

export function ReglagesOutil({ reglages }: { reglages: TypeReglages }) {
  const [etat, action, enCours] = useActionState(enregistrerLesReglages, INITIAL);
  const [edition, setEdition] = useState(false);

  if (!edition) {
    return (
      <Carte>
        <div className="flex items-start justify-between gap-4">
          <MicroLibelle>Ton outil</MicroLibelle>
          <button
            type="button"
            onClick={() => setEdition(true)}
            aria-label="Modifier tes réglages"
            className="text-texte-doux transition-colors duration-200 hover:text-accent"
          >
            <Icone nom="stylo" className="h-4 w-4" />
          </button>
        </div>
        <dl className="mt-5 flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-6">
            <dt className="text-texte-doux">Nom</dt>
            <dd>{reglages.nom_programme}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-texte-doux">Devise</dt>
            <dd>{reglages.devise}</dd>
          </div>
        </dl>
        {etat.enregistre && (
          <p className="mt-5 text-[13px] text-texte-doux">Tes réglages sont enregistrés.</p>
        )}
      </Carte>
    );
  }

  return (
    <Carte>
      <form action={action}>
        <MicroLibelle>Ton outil</MicroLibelle>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={ETIQUETTE}>Nom</span>
            <input name="nom_programme" defaultValue={reglages.nom_programme} className={CHAMP} />
            <span className="mt-1 block text-[13px] text-texte-doux">
              Affiché en haut à gauche et sur l&apos;écran de connexion.
            </span>
          </label>
          <label className="block">
            <span className={ETIQUETTE}>Devise</span>
            <input name="devise" defaultValue={reglages.devise} className={CHAMP} />
          </label>
        </div>
        <Pied enCours={enCours} etat={etat} onAnnuler={() => setEdition(false)} />
      </form>
    </Carte>
  );
}

/* ------------------------------------------------------------------ */
/*  Les étapes du pipe                                                 */
/* ------------------------------------------------------------------ */

type LigneEtape = { id?: string; nom: string; issue: string };

export function ReglagesEtapes({ etapes }: { etapes: Etape[] }) {
  const [etat, action, enCours] = useActionState(enregistrerLesEtapes, INITIAL);
  const [edition, setEdition] = useState(false);
  const [lignes, setLignes] = useState<LigneEtape[]>(() =>
    etapes.map((etape) => ({ id: etape.id, nom: etape.nom, issue: etape.issue })),
  );

  function reprendre() {
    setLignes(etapes.map((etape) => ({ id: etape.id, nom: etape.nom, issue: etape.issue })));
    setEdition(false);
  }

  if (!edition) {
    return (
      <Carte className="mt-5">
        <div className="flex items-start justify-between gap-4">
          <MicroLibelle>Tes étapes</MicroLibelle>
          <button
            type="button"
            onClick={() => setEdition(true)}
            aria-label="Modifier tes étapes"
            className="text-texte-doux transition-colors duration-200 hover:text-accent"
          >
            <Icone nom="stylo" className="h-4 w-4" />
          </button>
        </div>
        <ol className="mt-5 flex flex-col gap-2 text-sm">
          {etapes.map((etape, rang) => (
            <li key={etape.id} className="flex items-baseline gap-3">
              <span className="w-5 shrink-0 text-texte-doux tabular-nums">{rang + 1}</span>
              <span className="flex-1">{etape.nom}</span>
              {etape.issue !== "en_cours" && (
                <span className="text-[13px] text-texte-doux">
                  {etape.issue === "gagne" ? "Gagné" : "Perdu"}
                </span>
              )}
            </li>
          ))}
        </ol>
        {etat.enregistre && (
          <p className="mt-5 text-[13px] text-texte-doux">Tes étapes sont enregistrées.</p>
        )}
      </Carte>
    );
  }

  return (
    <Carte className="mt-5">
      <form action={action}>
        <MicroLibelle>Tes étapes</MicroLibelle>
        <p className="mt-3 text-[13px] text-texte-doux">
          L&apos;ordre des lignes est celui des colonnes de ton pipe. Marque
          « Gagné » ou « Perdu » les étapes de sortie : ce sont elles qui
          rendent ton taux de conversion calculable.
        </p>

        {/* La liste part en JSON dans un champ caché : des noms de champs
            indexés se décaleraient au premier retrait de ligne. */}
        <input type="hidden" name="lignes" value={JSON.stringify(lignes)} />

        <div className="mt-5 flex flex-col gap-2">
          {lignes.map((ligne, rang) => (
            <div key={ligne.id ?? `nouvelle-${rang}`} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-sm text-texte-doux tabular-nums">{rang + 1}</span>
              <input
                value={ligne.nom}
                onChange={(e) =>
                  setLignes((actuelles) =>
                    actuelles.map((l, r) => (r === rang ? { ...l, nom: e.target.value } : l)),
                  )
                }
                placeholder="Nom de l'étape"
                className={`flex-1 ${CHAMP_LIGNE}`}
              />
              <select
                value={ligne.issue}
                onChange={(e) =>
                  setLignes((actuelles) =>
                    actuelles.map((l, r) => (r === rang ? { ...l, issue: e.target.value } : l)),
                  )
                }
                aria-label="Issue de cette étape"
                className={`w-32 shrink-0 ${CHAMP_LIGNE}`}
              >
                {ISSUES.map((issue) => (
                  <option key={issue.valeur} value={issue.valeur}>
                    {issue.libelle}
                  </option>
                ))}
              </select>
              <Retirer
                onClick={() => setLignes((actuelles) => actuelles.filter((_, r) => r !== rang))}
              />
            </div>
          ))}
        </div>

        <Bouton
          type="button"
          variante="secondaire"
          className="mt-4 px-4 py-2 text-sm"
          onClick={() =>
            setLignes((actuelles) => [...actuelles, { nom: "", issue: "en_cours" }])
          }
        >
          Ajouter une étape
        </Bouton>

        <Pied enCours={enCours} etat={etat} onAnnuler={reprendre} />
      </form>
    </Carte>
  );
}

/* ------------------------------------------------------------------ */
/*  Les champs sur mesure                                              */
/* ------------------------------------------------------------------ */

type LigneChamp = {
  id?: string;
  libelle: string;
  aide: string;
  type: string;
  options: string;
  actif: boolean;
};

function enLigne(champ: Champ): LigneChamp {
  return {
    id: champ.id,
    libelle: champ.libelle,
    aide: champ.aide ?? "",
    type: champ.type,
    options: (champ.options ?? []).join(", "),
    actif: champ.actif,
  };
}

export function ReglagesChamps({ champs }: { champs: Champ[] }) {
  const [etat, action, enCours] = useActionState(enregistrerLesChamps, INITIAL);
  const [edition, setEdition] = useState(false);
  const [lignes, setLignes] = useState<LigneChamp[]>(() => champs.map(enLigne));

  function reprendre() {
    setLignes(champs.map(enLigne));
    setEdition(false);
  }

  if (!edition) {
    return (
      <Carte className="mt-5">
        <div className="flex items-start justify-between gap-4">
          <MicroLibelle>Tes champs</MicroLibelle>
          <button
            type="button"
            onClick={() => setEdition(true)}
            aria-label="Modifier tes champs"
            className="text-texte-doux transition-colors duration-200 hover:text-accent"
          >
            <Icone nom="stylo" className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-[13px] text-texte-doux">
          Ce que tu ajoutes à la fiche de chaque contact, en plus du nom, de
          l&apos;email et du reste.
        </p>
        {champs.length === 0 ? (
          <p className="mt-4 text-sm text-texte-doux">
            Aucun champ pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {champs.map((champ) => (
              <li key={champ.id} className="flex items-baseline justify-between gap-4">
                <span className={champ.actif ? "" : "text-texte-doux line-through"}>
                  {champ.libelle}
                </span>
                <span className="shrink-0 text-[13px] text-texte-doux">
                  {TYPES.find((t) => t.valeur === champ.type)?.libelle}
                </span>
              </li>
            ))}
          </ul>
        )}
        {etat.enregistre && (
          <p className="mt-5 text-[13px] text-texte-doux">Tes champs sont enregistrés.</p>
        )}
      </Carte>
    );
  }

  return (
    <Carte className="mt-5">
      <form action={action}>
        <MicroLibelle>Tes champs</MicroLibelle>
        <p className="mt-3 text-[13px] text-texte-doux">
          Décocher un champ le retire des fiches et garde les réponses. Le
          retirer tout à fait efface ce que tous tes contacts y ont répondu.
        </p>

        <input type="hidden" name="lignes" value={JSON.stringify(lignes)} />

        <div className="mt-5 flex flex-col gap-4">
          {lignes.map((ligne, rang) => (
            <div
              key={ligne.id ?? `nouveau-${rang}`}
              className="rounded-xl border border-bordure p-3"
            >
              <div className="flex items-center gap-2">
                <input
                  value={ligne.libelle}
                  onChange={(e) =>
                    setLignes((a) =>
                      a.map((l, r) => (r === rang ? { ...l, libelle: e.target.value } : l)),
                    )
                  }
                  placeholder="Nom du champ"
                  className={`flex-1 ${CHAMP_LIGNE}`}
                />
                <select
                  value={ligne.type}
                  onChange={(e) =>
                    setLignes((a) =>
                      a.map((l, r) => (r === rang ? { ...l, type: e.target.value } : l)),
                    )
                  }
                  aria-label="Type de ce champ"
                  className={`w-36 shrink-0 ${CHAMP_LIGNE}`}
                >
                  {TYPES.map((type) => (
                    <option key={type.valeur} value={type.valeur}>
                      {type.libelle}
                    </option>
                  ))}
                </select>
                <Retirer onClick={() => setLignes((a) => a.filter((_, r) => r !== rang))} />
              </div>

              {ligne.type === "choix" && (
                <input
                  value={ligne.options}
                  onChange={(e) =>
                    setLignes((a) =>
                      a.map((l, r) => (r === rang ? { ...l, options: e.target.value } : l)),
                    )
                  }
                  placeholder="Les choix, séparés par des virgules"
                  className={`mt-2 w-full ${CHAMP_LIGNE}`}
                />
              )}

              <div className="mt-2 flex items-center gap-3">
                <input
                  value={ligne.aide}
                  onChange={(e) =>
                    setLignes((a) =>
                      a.map((l, r) => (r === rang ? { ...l, aide: e.target.value } : l)),
                    )
                  }
                  placeholder="Aide sous le champ (facultatif)"
                  className={`flex-1 ${CHAMP_LIGNE}`}
                />
                <label className="flex shrink-0 items-center gap-2 text-sm text-texte-doux">
                  <input
                    type="checkbox"
                    checked={ligne.actif}
                    onChange={(e) =>
                      setLignes((a) =>
                        a.map((l, r) => (r === rang ? { ...l, actif: e.target.checked } : l)),
                      )
                    }
                    className="accent-accent"
                  />
                  Actif
                </label>
              </div>
            </div>
          ))}
        </div>

        <Bouton
          type="button"
          variante="secondaire"
          className="mt-4 px-4 py-2 text-sm"
          onClick={() =>
            setLignes((a) => [
              ...a,
              { libelle: "", aide: "", type: "texte_court", options: "", actif: true },
            ])
          }
        >
          Ajouter un champ
        </Bouton>

        <Pied enCours={enCours} etat={etat} onAnnuler={reprendre} />
      </form>
    </Carte>
  );
}
