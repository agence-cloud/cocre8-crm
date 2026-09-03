import { redirect } from "next/navigation";
import { lireCompteConnecte } from "@/lib/auth/compte";
import { installationFaite } from "@/lib/auth/installation";

/**
 * La racine ne dessine rien : elle aiguille, et c'est le premier pas de
 * toute installation neuve.
 *
 * **Une base vierge n'envoie pas vers un formulaire de connexion.** Celui
 * qui vient de déployer l'outil ouvre son adresse et n'a aucun compte : lui
 * montrer « ton adresse email, ton mot de passe » est un cul-de-sac, il n'a
 * rien à saisir et rien pour s'inscrire. Il tombe donc sur la seule chose
 * qu'il puisse faire, la mise en service.
 *
 * La question n'est posée qu'ici, et seulement pour un visiteur sans
 * session : sur un outil installé, c'est une requête de plus sur la page
 * d'accueil, et rien du tout sur les autres.
 */
export default async function Racine() {
  const compte = await lireCompteConnecte();
  if (compte) redirect("/contacts");

  if (!(await installationFaite())) redirect("/installation");

  redirect("/connexion");
}
