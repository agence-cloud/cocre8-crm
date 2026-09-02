export type Contact = {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  entreprise: string | null;
  etape_id: string | null;
  montant: number | null;
  source: string | null;
  notes: string | null;
  cree_le: string;
  modifie_le: string;
};

/** Ce qu'un contact a répondu à un champ sur mesure. */
export type ValeurChamp = {
  champ_id: string;
  valeur: string | null;
};

/**
 * Le nom affiché, prénom d'abord.
 *
 * Le prénom est facultatif : un carnet d'adresses porte des sociétés autant
 * que des personnes, et « Boulangerie Martin » n'a pas de prénom.
 */
export function nomComplet(contact: Pick<Contact, "nom" | "prenom">): string {
  return [contact.prenom, contact.nom].filter(Boolean).join(" ");
}

/**
 * Les initiales, pour la pastille de la liste.
 *
 * Une seule lettre quand il n'y a pas de prénom, plutôt que deux lettres du
 * même mot : « BO » pour Boulangerie se lit comme un sigle qui n'existe pas.
 */
export function initiales(contact: Pick<Contact, "nom" | "prenom">): string {
  const premiere = (contact.prenom ?? contact.nom).trim().charAt(0);
  const seconde = contact.prenom ? contact.nom.trim().charAt(0) : "";
  return (premiere + seconde).toUpperCase();
}

/**
 * Un montant, dans la devise réglée.
 *
 * Sans décimales : un pipe se lit en ordres de grandeur, et deux chiffres
 * après la virgule sur chaque carte ajoutent du bruit sans rien apprendre.
 */
export function formaterMontant(montant: number | null, devise: string): string {
  if (montant === null) return "";
  return `${Math.round(montant).toLocaleString("fr-FR")} ${devise}`;
}
