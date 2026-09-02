import type { Entree } from "@/lib/stats/requetes";

const MOIS = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];

/**
 * Les entrées dans le pipe, mois par mois, sur un an.
 *
 * Des colonnes en CSS plutôt qu'un graphique en SVG : douze valeurs entières
 * n'ont besoin ni d'axes ni d'échelle continue, et le chiffre est écrit
 * au-dessus de chaque colonne. Une librairie de graphiques pour ça serait une
 * dépendance de plus dans un outil que personne ne mettra à jour.
 */
export function Entrees({ entrees }: { entrees: Entree[] }) {
  const plusHaut = Math.max(1, ...entrees.map((entree) => entree.combien));

  return (
    <div className="mt-5 flex gap-2" style={{ height: "9rem" }}>
      {entrees.map((entree) => {
        const [annee, mois] = entree.mois.split("-");
        return (
          /* `h-full` sur la colonne, et non seulement sur la rangée : une
             hauteur en pourcentage se calcule sur un parent qui en a une, et
             sans elle les barres se dessinaient à zéro pixel. */
          <div
            key={entree.mois}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
          >
            <span className="text-[12px] text-texte-doux tabular-nums">{entree.combien}</span>
            <div
              className="w-full shrink-0 rounded-t-md bg-accent"
              style={{
                // Deux pixels au minimum : une colonne à zéro doit rester
                // visible, sinon le mois paraît absent du graphique.
                height: `${Math.max(2, (entree.combien / plusHaut) * 100)}%`,
                opacity: entree.combien === 0 ? 0.25 : 1,
              }}
            />
            <span className="truncate text-[11px] text-texte-doux">
              {MOIS[Number(mois) - 1]}
              {mois === "01" && ` ${annee.slice(2)}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
