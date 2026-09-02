"use client";

import { useOptimistic, useState, useTransition, type DragEvent } from "react";
import Link from "next/link";
import { deplacerContact } from "@/modules/crm/actions";
import { formaterMontant, nomComplet, type Contact } from "@/lib/contact/types";
import type { Etape } from "@/lib/etape/types";

/**
 * Le pipe en colonnes, et le glisser qui déplace une carte.
 *
 * **`useOptimistic` et non `useState`.** La carte change de colonne avant que
 * le serveur réponde, et retombe d'elle-même si la base refuse. Avec un état
 * local, il faudrait resynchroniser à la main, et une carte qui ment sur
 * l'étape d'un contact est pire qu'une carte lente.
 *
 * **Le total de chaque colonne est en tête, pas en pied.** Ce qu'on vient
 * chercher en ouvrant un pipe, c'est ce que pèse chaque étape : le mettre en
 * bas oblige à faire défiler une colonne longue pour l'atteindre.
 *
 * Le glisser reste doublé d'une liste déroulante sur la fiche du contact :
 * un glisser ne se fait pas au clavier, et se fait mal sur un téléphone.
 */
export function Pipe({
  contacts,
  etapes,
  devise,
}: {
  contacts: Contact[];
  etapes: Etape[];
  devise: string;
}) {
  const [places, deplacerTout_de_suite] = useOptimistic(
    contacts,
    (liste: Contact[], mouvement: { id: string; etapeId: string }) =>
      liste.map((contact) =>
        contact.id === mouvement.id ? { ...contact, etape_id: mouvement.etapeId } : contact,
      ),
  );
  const [survolee, setSurvolee] = useState<string | null>(null);
  const [, demarrer] = useTransition();

  function deposer(evenement: DragEvent<HTMLDivElement>, etapeId: string) {
    evenement.preventDefault();
    setSurvolee(null);
    const id = evenement.dataTransfer.getData("text/plain");
    if (!id) return;

    const contact = places.find((c) => c.id === id);
    if (!contact || contact.etape_id === etapeId) return;

    demarrer(async () => {
      deplacerTout_de_suite({ id, etapeId });
      try {
        await deplacerContact(id, etapeId);
      } catch {
        // Ne pas relancer : la transition se termine, et la liste retombe sur
        // ce que le serveur porte, c'est à dire l'ancienne étape. La relancer
        // ferait remonter une frontière d'erreur à la place du pipe entier.
      }
    });
  }

  return (
    <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
      {etapes.map((etape) => {
        const dedans = places.filter((contact) => contact.etape_id === etape.id);
        const total = dedans.reduce((somme, c) => somme + Number(c.montant ?? 0), 0);

        return (
          <div
            key={etape.id}
            onDragOver={(e) => {
              e.preventDefault();
              setSurvolee(etape.id);
            }}
            onDragLeave={() => setSurvolee((actuelle) => (actuelle === etape.id ? null : actuelle))}
            onDrop={(e) => deposer(e, etape.id)}
            className={`flex w-72 shrink-0 flex-col rounded-carte border p-3 transition-colors duration-200 ${
              survolee === etape.id
                ? "border-accent bg-accent-doux"
                : "border-bordure bg-fond"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2 px-1 pb-3">
              <span className="truncate text-[15px] font-medium">{etape.nom}</span>
              <span className="shrink-0 text-[13px] text-texte-doux tabular-nums">
                {dedans.length}
                {total > 0 && ` · ${formaterMontant(total, devise)}`}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {dedans.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", contact.id)}
                  className="block cursor-grab rounded-xl border border-bordure bg-fond-alt px-3 py-2.5 transition-colors duration-200 hover:border-texte/25 active:cursor-grabbing"
                >
                  <span className="block truncate text-sm">{nomComplet(contact)}</span>
                  {contact.entreprise && (
                    <span className="block truncate text-[13px] text-texte-doux">
                      {contact.entreprise}
                    </span>
                  )}
                  {contact.montant !== null && (
                    <span className="mt-1 block text-[13px] tabular-nums text-accent">
                      {formaterMontant(contact.montant, devise)}
                    </span>
                  )}
                </Link>
              ))}

              {dedans.length === 0 && (
                <p className="px-1 py-3 text-[13px] text-texte-doux">
                  Rien ici. Fais glisser une carte.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
