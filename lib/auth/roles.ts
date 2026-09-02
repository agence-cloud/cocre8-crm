/**
 * **Un seul compte, et c'est tout le modèle.** Le CRM est l'outil de son
 * propriétaire : il n'a pas de clients qui s'y connectent, pas de rôle à
 * arbitrer, pas d'espace à cloisonner. Le portail dont ce socle est copié en
 * avait deux, `admin` et `membre`, et ce rôle décidait de l'atterrissage.
 *
 * Le type reste, réduit à une seule valeur : il traverse `compte.role` et les
 * fonctions de permission de la base, où une colonne à valeur unique se lit
 * mieux qu'une colonne absente. Le jour où un second siège apparaît, c'est ici
 * qu'il s'ajoute.
 */
export type Role = "admin";

export type CompteConnecte = {
  id: string;
  role: Role;
  nom: string;
};

/** Où atterrit un compte connecté. Un seul endroit, faute de second rôle. */
export function cheminAccueil(): string {
  return "/contacts";
}
