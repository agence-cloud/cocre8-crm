"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Carte } from "@/lib/design/Carte";
import { Bouton } from "@/lib/design/Bouton";
import { CHAMP, ETIQUETTE } from "@/lib/design/champs";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import { CIBLES, lireCsv, proposerLaCorrespondance, type Tableau } from "@/lib/contact/csv";
import { importerDesContacts, type BilanImport } from "@/modules/crm/actions";
import type { Etape } from "@/lib/etape/types";

/**
 * L'import d'un fichier, en trois temps : choisir, vérifier, importer.
 *
 * **Le temps du milieu est celui qui compte.** L'app propose une
 * correspondance entre les colonnes du fichier et celles d'une fiche, et
 * montre les trois premières lignes telles qu'elles arriveront. Sans cette
 * vérification, on découvre que les prénoms sont partis dans « entreprise »
 * une fois les deux cents contacts créés.
 *
 * Le fichier est lu dans le navigateur : il ne part au serveur que sous forme
 * de lignes déjà rangées. Un fichier de plusieurs mégaoctets ne traverserait
 * pas une action serveur, qui plafonne à un mégaoctet.
 */
export function ImportCsv({ etapes }: { etapes: Etape[] }) {
  const [tableau, setTableau] = useState<Tableau | null>(null);
  const [correspondance, setCorrespondance] = useState<Record<number, string>>({});
  const [etapeId, setEtapeId] = useState<string>(etapes[0]?.id ?? "");
  const [bilan, setBilan] = useState<BilanImport | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  async function choisir(fichier: File) {
    setErreur(null);
    setBilan(null);
    const contenu = await fichier.text();
    const lu = lireCsv(contenu);

    if (lu.entetes.length === 0 || lu.lignes.length === 0) {
      setErreur("Ce fichier ne contient aucune ligne lisible.");
      setTableau(null);
      return;
    }

    setTableau(lu);
    setCorrespondance(proposerLaCorrespondance(lu.entetes));
  }

  const nomTrouve = Object.values(correspondance).includes("nom");

  function importer() {
    if (!tableau) return;

    const lignes = tableau.lignes.map((cellules) => {
      const ligne: Record<string, string> = {};
      for (const [rang, cible] of Object.entries(correspondance)) {
        if (cible) ligne[cible] = cellules[Number(rang)] ?? "";
      }
      return ligne;
    });

    demarrer(async () => {
      setBilan(await importerDesContacts(lignes, etapeId || null));
      setTableau(null);
    });
  }

  if (bilan) {
    return (
      <Carte className="mt-6">
        <MicroLibelle>Import terminé</MicroLibelle>
        <p className="mt-3 text-[15px]">
          {bilan.ajoutes} contact{bilan.ajoutes > 1 ? "s" : ""} ajouté
          {bilan.ajoutes > 1 ? "s" : ""}.
        </p>

        {bilan.ecartes.length > 0 && (
          <>
            <p className="mt-4 text-sm text-texte-doux">
              {bilan.ecartes.length} ligne{bilan.ecartes.length > 1 ? "s" : ""} écartée
              {bilan.ecartes.length > 1 ? "s" : ""}. Le numéro est celui de ton tableur.
            </p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {bilan.ecartes.map((ecarte) => (
                <li key={ecarte.ligne} className="flex gap-3">
                  <span className="shrink-0 text-texte-doux tabular-nums">
                    Ligne {ecarte.ligne}
                  </span>
                  <span>
                    {ecarte.nom && <span className="text-texte-doux">{ecarte.nom} : </span>}
                    {ecarte.pourquoi}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-5 flex gap-3">
          <Link href="/contacts">
            <Bouton>Voir mes contacts</Bouton>
          </Link>
          <Bouton variante="secondaire" onClick={() => setBilan(null)}>
            Importer un autre fichier
          </Bouton>
        </div>
      </Carte>
    );
  }

  if (!tableau) {
    return (
      <Carte className="mt-6">
        <MicroLibelle>Ton fichier</MicroLibelle>
        <p className="mt-3 text-sm text-texte-doux">
          Un fichier CSV, celui que ton tableur exporte. La première ligne doit
          porter les noms de colonnes.
        </p>

        <label className="mt-5 block">
          <span className={ETIQUETTE}>Choisir le fichier</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const fichier = e.target.files?.[0];
              if (fichier) void choisir(fichier);
            }}
            className={CHAMP}
          />
        </label>

        {erreur && <p className="mt-4 text-sm text-accent">{erreur}</p>}
      </Carte>
    );
  }

  return (
    <>
      <Carte className="mt-6">
        <MicroLibelle>Vérifie les colonnes</MicroLibelle>
        <p className="mt-3 text-sm text-texte-doux">
          {tableau.lignes.length} ligne{tableau.lignes.length > 1 ? "s" : ""} lue
          {tableau.lignes.length > 1 ? "s" : ""}. Dis pour chaque colonne de ton
          fichier où elle doit aller. Ce qui reste sur « Ne pas importer » est ignoré.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {tableau.entetes.map((entete, rang) => (
            <label key={`${entete}-${rang}`} className="block">
              <span className={ETIQUETTE}>{entete || `Colonne ${rang + 1}`}</span>
              <select
                value={correspondance[rang] ?? ""}
                onChange={(e) =>
                  setCorrespondance((actuelle) => ({ ...actuelle, [rang]: e.target.value }))
                }
                className={CHAMP}
              >
                <option value="">Ne pas importer</option>
                {CIBLES.map((cible) => (
                  <option key={cible.cle} value={cible.cle}>
                    {cible.libelle}
                  </option>
                ))}
              </select>
              <span className="mt-1 block truncate text-[13px] text-texte-doux">
                Exemple : {tableau.lignes[0]?.[rang] || "vide"}
              </span>
            </label>
          ))}
        </div>

        <label className="mt-5 block max-w-xs">
          <span className={ETIQUETTE}>Poser tout le monde sur l&apos;étape</span>
          <select value={etapeId} onChange={(e) => setEtapeId(e.target.value)} className={CHAMP}>
            <option value="">Sans étape</option>
            {etapes.map((etape) => (
              <option key={etape.id} value={etape.id}>
                {etape.nom}
              </option>
            ))}
          </select>
        </label>

        {!nomTrouve && (
          <p className="mt-4 text-sm text-accent">
            Il faut au moins dire quelle colonne porte le nom : c&apos;est le
            seul champ obligatoire d&apos;une fiche.
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <Bouton onClick={importer} disabled={enCours || !nomTrouve}>
            {enCours
              ? "Import en cours..."
              : `Importer ${tableau.lignes.length} contact${tableau.lignes.length > 1 ? "s" : ""}`}
          </Bouton>
          <Bouton variante="secondaire" onClick={() => setTableau(null)}>
            Changer de fichier
          </Bouton>
        </div>
      </Carte>

      <Carte ton="calme" className="mt-5 overflow-x-auto shadow-douce">
        <MicroLibelle>Les trois premières lignes, telles qu&apos;elles arriveront</MicroLibelle>
        <table className="mt-4 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-bordure text-[12px] tracking-[0.08em] text-texte-doux uppercase">
              {CIBLES.filter((cible) =>
                Object.values(correspondance).includes(cible.cle),
              ).map((cible) => (
                <th key={cible.cle} className="px-3 py-2 font-medium">
                  {cible.libelle}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableau.lignes.slice(0, 3).map((cellules, rang) => (
              <tr key={rang} className="border-b border-bordure last:border-0">
                {CIBLES.filter((cible) =>
                  Object.values(correspondance).includes(cible.cle),
                ).map((cible) => {
                  const colonne = Object.entries(correspondance).find(
                    ([, valeur]) => valeur === cible.cle,
                  );
                  return (
                    <td key={cible.cle} className="px-3 py-2">
                      {colonne ? (cellules[Number(colonne[0])] ?? "") : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Carte>
    </>
  );
}
