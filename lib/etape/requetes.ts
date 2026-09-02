import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Etape } from "@/lib/etape/types";

/**
 * Les étapes du pipe, dans l'ordre.
 *
 * Le tri porte sur `ordre` puis sur `nom` : deux étapes peuvent partager un
 * rang le temps qu'on réorganise, et un ordre instable ferait sauter les
 * colonnes d'un rechargement à l'autre sous les yeux de qui les déplace.
 */
export async function lireEtapes(): Promise<Etape[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("etape")
    .select("id, nom, ordre, issue")
    .order("ordre")
    .order("nom");

  if (error) throw new Error(`Lecture des étapes impossible : ${error.message}`);
  return (data ?? []) as Etape[];
}
