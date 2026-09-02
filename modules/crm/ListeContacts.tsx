"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Carte } from "@/lib/design/Carte";
import { CHAMP } from "@/lib/design/champs";
import { formaterJourMoisCourt } from "@/lib/dates";
import { formaterMontant, initiales, nomComplet, type Contact } from "@/lib/contact/types";
import type { Etape } from "@/lib/etape/types";

/**
 * Le carnet d'adresses : tout le monde, avec ses propriétés.
 *
 * **La recherche et le filtre vivent dans le navigateur**, sur la liste déjà
 * chargée. Un indépendant n'atteint pas le millier de contacts, et filtrer
 * sans aller-retour rend la frappe instantanée. Le jour où quelqu'un les
 * dépasse, c'est `lireContacts` qu'il faudra paginer, et ce composant suivra.
 *
 * La recherche porte sur tout ce qui est affiché, y compris l'entreprise et
 * l'email : quelqu'un cherche « boulangerie » aussi souvent qu'un nom.
 */
export function ListeContacts({
  contacts,
  etapes,
  devise,
}: {
  contacts: Contact[];
  etapes: Etape[];
  devise: string;
}) {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<string>("");

  const nomEtape = useMemo(
    () => new Map(etapes.map((etape) => [etape.id, etape.nom])),
    [etapes],
  );

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (filtre && contact.etape_id !== filtre) return false;
      if (!terme) return true;
      return [contact.nom, contact.prenom, contact.email, contact.entreprise, contact.source]
        .filter(Boolean)
        .some((valeur) => valeur!.toLowerCase().includes(terme));
    });
  }, [contacts, recherche, filtre]);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Chercher un nom, une entreprise, un email"
          aria-label="Chercher un contact"
          className={`min-w-64 flex-1 ${CHAMP}`}
        />
        <select
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          aria-label="Filtrer par étape"
          className={CHAMP.replace("w-full", "w-auto")}
        >
          <option value="">Toutes les étapes</option>
          {etapes.map((etape) => (
            <option key={etape.id} value={etape.id}>
              {etape.nom}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-sm text-texte-doux">
        {visibles.length} contact{visibles.length > 1 ? "s" : ""}
        {visibles.length !== contacts.length && ` sur ${contacts.length}`}
      </p>

      {visibles.length === 0 ? (
        <Carte ton="calme" className="mt-4">
          <p className="text-sm text-texte-doux">
            {contacts.length === 0
              ? "Aucun contact pour l'instant. Ajoute le premier, ou importe ton fichier."
              : "Aucun contact ne correspond."}
          </p>
        </Carte>
      ) : (
        <Carte className="mt-4 overflow-x-auto p-0">
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-bordure text-[12px] tracking-[0.08em] text-texte-doux uppercase">
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-5 py-3 font-medium">Entreprise</th>
                <th className="px-5 py-3 font-medium">Étape</th>
                <th className="px-5 py-3 text-right font-medium">Montant</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Vu le</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b border-bordure transition-colors duration-200 last:border-0 hover:bg-surface"
                >
                  <td className="px-5 py-3">
                    <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pilule bg-accent-doux text-[12px] font-semibold text-accent"
                      >
                        {initiales(contact)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate">{nomComplet(contact)}</span>
                        {contact.email && (
                          <span className="block truncate text-[13px] text-texte-doux">
                            {contact.email}
                          </span>
                        )}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-texte-doux">{contact.entreprise ?? ""}</td>
                  <td className="px-5 py-3">
                    {contact.etape_id ? (
                      <span className="rounded-pilule bg-surface px-2.5 py-1 text-[12px]">
                        {nomEtape.get(contact.etape_id) ?? "Étape retirée"}
                      </span>
                    ) : (
                      <span className="text-[13px] text-texte-doux">Sans étape</span>
                    )}
                  </td>
                  {/* tabular-nums : sans lui, une colonne de montants ne
                      s'aligne pas et se compare mal d'une ligne à l'autre. */}
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formaterMontant(contact.montant, devise)}
                  </td>
                  <td className="px-5 py-3 text-texte-doux">{contact.source ?? ""}</td>
                  <td className="px-5 py-3 text-texte-doux tabular-nums">
                    {formaterJourMoisCourt(contact.modifie_le)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Carte>
      )}
    </>
  );
}
