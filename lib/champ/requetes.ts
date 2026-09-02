import { creerClientServeur } from "@/lib/supabase/serveur";
import { optionsDe, type Champ } from "@/lib/champ/types";

/** Les champs sur mesure. `actifsSeulement` pour ce qu'on affiche sur une fiche. */
export async function lireChamps(actifsSeulement = true): Promise<Champ[]> {
  const supabase = await creerClientServeur();
  let requete = supabase
    .from("champ")
    .select("id, libelle, aide, type, options, ordre, actif")
    .order("ordre");

  if (actifsSeulement) requete = requete.eq("actif", true);

  const { data, error } = await requete;
  if (error) throw new Error(`Lecture des champs impossible : ${error.message}`);

  return (data ?? []).map((ligne) => ({
    ...ligne,
    options: optionsDe(ligne.options),
  })) as Champ[];
}
