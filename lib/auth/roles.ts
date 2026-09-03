/**
 * **Un seul compte, et c'est tout le modèle.** Le CRM est l'outil de son
 * propriétaire : il n'a pas de clients qui s'y connectent, pas de rôle à
 * arbitrer, pas d'espace à cloisonner. Le portail dont ce socle est copié en
 * avait deux, `admin` et `membre`, et ce rôle décidait de l'atterrissage.
 *
 * **Il n'en reste donc aucune trace, ni en base ni ici**, et il en restait une
 * de trop : le compte lu portait un champ `role` que `install.sql` ne créait
 * pas. Personne ne s'en apercevait avant la toute première connexion, où
 * Postgres refusait la colonne et l'outil rendait une erreur serveur à celui
 * qui venait de poser son compte. Le jour où un second siège apparaît, le
 * rôle revient ici **et** dans `install.sql`, jamais dans un seul des deux.
 */
export type CompteConnecte = {
  id: string;
  nom: string;
};

/** Où atterrit un compte connecté. Un seul endroit, faute de second rôle. */
export function cheminAccueil(): string {
  return "/contacts";
}
