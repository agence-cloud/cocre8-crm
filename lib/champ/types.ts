export type TypeChamp = "texte_court" | "texte_long" | "nombre" | "date" | "choix";

export type Champ = {
  id: string;
  libelle: string;
  aide: string | null;
  type: TypeChamp;
  options: string[] | null;
  ordre: number;
  actif: boolean;
};

export const TYPES: readonly { valeur: TypeChamp; libelle: string }[] = [
  { valeur: "texte_court", libelle: "Texte court" },
  { valeur: "texte_long", libelle: "Texte long" },
  { valeur: "nombre", libelle: "Nombre" },
  { valeur: "date", libelle: "Date" },
  { valeur: "choix", libelle: "Liste de choix" },
];

/**
 * Les options d'un champ de type `choix`, telles que la base les porte.
 *
 * La colonne est du JSON libre, donc elle peut contenir n'importe quoi : une
 * base modifiée à la main ne doit pas faire tomber l'écran d'un contact. Tout
 * ce qui n'est pas une liste de textes retombe sur une liste vide, ce qui se
 * voit et se corrige.
 */
export function optionsDe(brut: unknown): string[] | null {
  if (!Array.isArray(brut)) return null;
  return brut.filter((valeur): valeur is string => typeof valeur === "string");
}
