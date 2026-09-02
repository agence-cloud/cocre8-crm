/**
 * Ce que chaque coach règle depuis l'app, sans toucher au code.
 *
 * **Les valeurs par défaut vivent ici, en code, et non en base.** Une base
 * neuve n'a aucune ligne de réglage, et l'app doit tourner quand même : une
 * valeur manquante retombe sur celle d'ici plutôt que de laisser un trou à
 * l'écran. C'est aussi ce qui permet d'ajouter un réglage sans migration.
 *
 * **Rien de secret n'entre dans ces réglages.** Ils sont lus par le client
 * autant que par le coach : tout ce qu'on y pose est public pour lui.
 */
export type Reglages = {
  /** Le nom affiché en tête de l'outil et sur l'écran de connexion. */
  nom_programme: string;
  /** Le symbole des montants. Un CRM qui compte en dollars chez un Français
   *  ne se corrige pas, il se règle. */
  devise: string;
};

/**
 * Le nom du programme a son double dans `install.sql`, dans la fonction
 * `nom_du_programme()` qui répond à l'écran de connexion. Les deux doivent
 * dire la même chose : c'est la seule valeur dupliquée, et elle l'est parce
 * qu'un visiteur sans session ne peut pas lire la table.
 */
export const REGLAGES_PAR_DEFAUT: Reglages = {
  nom_programme: "Mon CRM",
  devise: "€",
};

/**
 * Recompose des réglages complets à partir de ce que la base porte.
 *
 * Chaque valeur est vérifiée dans sa forme avant d'être retenue. Une base qui
 * a vieilli, ou qu'on a modifiée à la main, ne doit pas faire tomber un écran
 * pour un objet qui ne ressemble plus à ce qu'on attend : elle retombe sur le
 * défaut, ce qui se voit et se corrige, plutôt que de lever.
 */
export function composerReglages(lignes: { cle: string; valeur: unknown }[]): Reglages {
  const brut = new Map(lignes.map((ligne) => [ligne.cle, ligne.valeur]));

  const texte = (cle: keyof Reglages, defaut: string): string => {
    const valeur = brut.get(cle);
    return typeof valeur === "string" ? valeur : defaut;
  };

  return {
    nom_programme: texte("nom_programme", REGLAGES_PAR_DEFAUT.nom_programme),
    devise: texte("devise", REGLAGES_PAR_DEFAUT.devise),
  };
}

/** Un mot en tête de phrase, quand un libellé réglé arrive en minuscules. */
export function majuscule(mot: string): string {
  return mot.charAt(0).toUpperCase() + mot.slice(1);
}
