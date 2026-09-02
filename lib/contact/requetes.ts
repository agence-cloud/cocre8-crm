import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Contact, ValeurChamp } from "@/lib/contact/types";

const COLONNES =
  "id, nom, prenom, email, telephone, entreprise, etape_id, montant, source, notes, cree_le, modifie_le";

/**
 * Tous les contacts, le plus récemment touché en premier.
 *
 * Pas de pagination, et c'est un choix pour cet outil-ci : un indépendant
 * n'atteint pas le millier de contacts, et une liste entière se filtre dans le
 * navigateur sans aller-retour. Le jour où quelqu'un les dépasse, c'est ici
 * que ça se voit.
 */
export async function lireContacts(): Promise<Contact[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("contact")
    .select(COLONNES)
    .order("modifie_le", { ascending: false });

  if (error) throw new Error(`Lecture des contacts impossible : ${error.message}`);
  return (data ?? []) as Contact[];
}

export async function lireContact(id: string): Promise<Contact | null> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("contact")
    .select(COLONNES)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Lecture du contact impossible : ${error.message}`);
  return (data as Contact) ?? null;
}

/** Ce qu'un contact a répondu à ses champs sur mesure. */
export async function lireValeurs(contactId: string): Promise<ValeurChamp[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("valeur_champ")
    .select("champ_id, valeur")
    .eq("contact_id", contactId);

  if (error) throw new Error(`Lecture des champs impossible : ${error.message}`);
  return (data ?? []) as ValeurChamp[];
}

/** Le passage d'étape en étape, du plus ancien au plus récent. */
export async function lireHistorique(
  contactId: string,
): Promise<{ etape_nom: string; entre_le: string }[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("etape_historique")
    .select("etape_nom, entre_le")
    .eq("contact_id", contactId)
    .order("entre_le");

  if (error) throw new Error(`Lecture de l'historique impossible : ${error.message}`);
  return data ?? [];
}
