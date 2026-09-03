import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/serveur";
import type { CompteConnecte } from "@/lib/auth/roles";

export async function lireCompteConnecte(): Promise<CompteConnecte | null> {
  const supabase = await creerClientServeur();

  // getUser vérifie le jeton auprès de Supabase. getSession se contente de
  // lire le cookie, qui peut être forgé : ne jamais s'en servir pour décider
  // d'un droit d'accès.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("compte")
    .select("id, nom, actif")
    .eq("id", user.id)
    .single();

  // PGRST116 signifie « aucune ligne », le cas normal d'un utilisateur sans
  // compte chez nous. Toute autre erreur est un incident : la taire ferait
  // passer une base injoignable pour une déconnexion.
  if (error && error.code !== "PGRST116") {
    throw new Error(`Lecture du compte impossible : ${error.message}`);
  }

  if (!data || !data.actif) return null;

  return {
    id: data.id,
    nom: data.nom,
  };
}

/**
 * À appeler en tête de chaque page, et pas seulement dans la mise en page :
 * une action serveur s'appelle par requête HTTP, elle ne traverse aucun
 * layout.
 *
 * Le portail dont ce socle est copié avait trois gardes, une par rôle. Il n'y
 * a plus qu'un rôle, donc une seule garde : être connecté, c'est être chez
 * soi.
 */
export async function exigerCompte(): Promise<CompteConnecte> {
  const compte = await lireCompteConnecte();
  if (!compte) redirect("/connexion");
  return compte;
}
