import type { Contact } from "@/lib/contact/types";
import type { Etape } from "@/lib/etape/types";
import { formaterMontant } from "@/lib/contact/types";

/**
 * L'entonnoir : combien de contacts à chaque étape, et ce qu'ils pèsent.
 *
 * **Des barres et pas un vrai entonnoir en biseau.** Un entonnoir dessiné
 * suppose que chacun traverse les étapes dans l'ordre, or un contact peut
 * revenir en arrière ou sauter une étape. Une barre par étape dit exactement
 * ce qu'elle mesure : qui s'y trouve maintenant.
 *
 * La largeur se calcule sur l'étape la plus fournie, pas sur le total : sur un
 * pipe où une étape en porte trente et les autres deux, un pourcentage du
 * total rendrait cinq barres invisibles.
 */
export function Entonnoir({
  contacts,
  etapes,
  devise,
}: {
  contacts: Contact[];
  etapes: Etape[];
  devise: string;
}) {
  const rangs = etapes.map((etape) => {
    const dedans = contacts.filter((contact) => contact.etape_id === etape.id);
    return {
      etape,
      combien: dedans.length,
      montant: dedans.reduce((somme, c) => somme + Number(c.montant ?? 0), 0),
    };
  });

  const plusHaut = Math.max(1, ...rangs.map((rang) => rang.combien));

  return (
    <div className="mt-4 flex flex-col gap-3">
      {rangs.map(({ etape, combien, montant }) => (
        <div key={etape.id}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="truncate">{etape.nom}</span>
            <span className="shrink-0 text-texte-doux tabular-nums">
              {combien}
              {montant > 0 && ` · ${formaterMontant(montant, devise)}`}
            </span>
          </div>
          {/* La piste reste visible même à zéro : une barre absente se lit
              comme une donnée manquante, une piste vide comme un zéro. */}
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-pilule bg-surface">
            <div
              className={`h-full rounded-pilule ${
                etape.issue === "gagne"
                  ? "bg-vert"
                  : etape.issue === "perdu"
                    ? "bg-texte-doux/40"
                    : "bg-accent"
              }`}
              style={{ width: `${(combien / plusHaut) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
