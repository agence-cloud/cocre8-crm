export type IssueEtape = "en_cours" | "gagne" | "perdu";

export type Etape = {
  id: string;
  nom: string;
  ordre: number;
  issue: IssueEtape;
};

/**
 * Ce que dit une étape sur la suite de l'histoire.
 *
 * Trois valeurs et pas deux : « en cours » n'est pas l'absence de résultat,
 * c'est l'état de tout ce qui vit encore dans le pipe. Sans lui, un taux de
 * conversion n'aurait aucun dénominateur qui veuille dire quelque chose.
 */
export const ISSUES: readonly { valeur: IssueEtape; libelle: string }[] = [
  { valeur: "en_cours", libelle: "En cours" },
  { valeur: "gagne", libelle: "Gagné" },
  { valeur: "perdu", libelle: "Perdu" },
];

export function libelleIssue(issue: IssueEtape): string {
  return ISSUES.find((i) => i.valeur === issue)?.libelle ?? "En cours";
}
