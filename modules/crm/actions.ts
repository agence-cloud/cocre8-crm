"use server";

/**
 * Les écritures du CRM.
 *
 * **Chacune appelle `exigerCompte` en tête**, et pas seulement les pages qui
 * les déclenchent : une action serveur s'appelle par requête HTTP, elle ne
 * traverse aucun layout. Une garde posée uniquement sur l'écran ne garde rien.
 *
 * Les permissions de la base disent ensuite ce qui est permis. La garde d'ici
 * ne les remplace pas, elle évite qu'un inconnu fasse travailler la base pour
 * se faire refuser au bout.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerCompte } from "@/lib/auth/compte";
import { creerClientServeur } from "@/lib/supabase/serveur";

function rafraichir() {
  revalidatePath("/", "layout");
}

export type Resultat = { erreur: string | null };

/** Le message d'un doublon d'email, dit en français plutôt qu'en PostgreSQL. */
function messageDe(erreur: { code?: string; message: string }): string {
  return erreur.code === "23505"
    ? "Un contact porte déjà cette adresse email."
    : erreur.message;
}

export async function ajouterContact(donnees: FormData): Promise<Resultat> {
  await exigerCompte();
  const supabase = await creerClientServeur();

  const texte = (nom: string) => String(donnees.get(nom) ?? "").trim() || null;
  const nom = texte("nom");
  if (!nom) return { erreur: "Le nom est le seul champ obligatoire." };

  const montant = texte("montant");

  const { data, error } = await supabase
    .from("contact")
    .insert({
      nom,
      prenom: texte("prenom"),
      email: texte("email"),
      telephone: texte("telephone"),
      entreprise: texte("entreprise"),
      source: texte("source"),
      etape_id: texte("etape_id"),
      montant: montant === null ? null : Number(montant.replace(",", ".")),
    })
    .select("id")
    .single();

  if (error) return { erreur: messageDe(error) };

  rafraichir();
  redirect(`/contacts/${data.id}`);
}

export async function modifierContact(id: string, donnees: FormData): Promise<Resultat> {
  await exigerCompte();
  const supabase = await creerClientServeur();

  const texte = (nom: string) => String(donnees.get(nom) ?? "").trim() || null;
  const nom = texte("nom");
  if (!nom) return { erreur: "Le nom est le seul champ obligatoire." };

  const montant = texte("montant");

  const { error } = await supabase
    .from("contact")
    .update({
      nom,
      prenom: texte("prenom"),
      email: texte("email"),
      telephone: texte("telephone"),
      entreprise: texte("entreprise"),
      source: texte("source"),
      notes: texte("notes"),
      montant: montant === null ? null : Number(montant.replace(",", ".")),
    })
    .eq("id", id);

  if (error) return { erreur: messageDe(error) };

  rafraichir();
  return { erreur: null };
}

/**
 * Déplacer un contact d'une étape à l'autre.
 *
 * L'historique ne s'écrit pas ici : un déclencheur de la base s'en charge, à
 * chaque changement d'étape et par quelque chemin que ce soit. Une écriture
 * qu'on peut oublier finit par être oubliée, et un entonnoir à trous ne se
 * répare pas rétroactivement.
 */
export async function deplacerContact(id: string, etapeId: string | null): Promise<void> {
  await exigerCompte();
  const supabase = await creerClientServeur();

  const { data, error } = await supabase
    .from("contact")
    .update({ etape_id: etapeId })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Déplacement impossible : ${error.message}`);
  // Une mise à jour qu'aucune politique n'autorise ne lève pas d'erreur, elle
  // ne touche aucune ligne. Sans cette vérification, la carte resterait dans
  // sa nouvelle colonne à l'écran alors que la base n'a rien enregistré.
  if (!data) throw new Error("Ce contact n'existe plus.");

  rafraichir();
}

export async function retirerContact(id: string): Promise<void> {
  await exigerCompte();
  const supabase = await creerClientServeur();

  const { error } = await supabase.from("contact").delete().eq("id", id);
  if (error) throw new Error(`Suppression impossible : ${error.message}`);

  rafraichir();
  redirect("/contacts");
}

/** Ce qu'un contact a répondu à ses champs sur mesure, en une fois. */
export async function enregistrerLesValeurs(
  contactId: string,
  valeurs: { champ_id: string; valeur: string }[],
): Promise<Resultat> {
  await exigerCompte();
  const supabase = await creerClientServeur();

  // Une réponse vidée se retire au lieu de rester en base : sans ça, une fiche
  // porterait des lignes vides qu'aucun écran ne montre et qui fausseraient
  // un export.
  const aRetirer = valeurs.filter((v) => !v.valeur.trim()).map((v) => v.champ_id);
  const aPoser = valeurs
    .filter((v) => v.valeur.trim())
    .map((v) => ({ contact_id: contactId, champ_id: v.champ_id, valeur: v.valeur.trim() }));

  if (aRetirer.length > 0) {
    const { error } = await supabase
      .from("valeur_champ")
      .delete()
      .eq("contact_id", contactId)
      .in("champ_id", aRetirer);
    if (error) return { erreur: error.message };
  }

  if (aPoser.length > 0) {
    const { error } = await supabase
      .from("valeur_champ")
      .upsert(aPoser, { onConflict: "contact_id,champ_id" });
    if (error) return { erreur: error.message };
  }

  rafraichir();
  return { erreur: null };
}

/**
 * L'import d'un fichier, ligne par ligne.
 *
 * **Il n'abandonne pas à la première erreur.** Un fichier de deux cents
 * contacts en porte toujours un avec une adresse en double ou un nom vide :
 * s'arrêter là laisserait la moitié du fichier importée sans dire laquelle.
 * Chaque ligne est tentée, et le compte-rendu dit ce qui est passé et ce qui
 * a été écarté, avec le numéro de ligne du fichier.
 *
 * **Rien n'écrase.** Un contact dont l'email existe déjà est écarté, pas mis à
 * jour : un import est le geste le plus facile à relancer par erreur, et une
 * fusion silencieuse effacerait le travail fait à la main entre les deux.
 */
export type BilanImport = {
  ajoutes: number;
  ecartes: { ligne: number; nom: string; pourquoi: string }[];
};

export async function importerDesContacts(
  lignes: Record<string, string>[],
  etapeId: string | null,
): Promise<BilanImport> {
  await exigerCompte();
  const supabase = await creerClientServeur();

  const bilan: BilanImport = { ajoutes: 0, ecartes: [] };

  for (const [rang, ligne] of lignes.entries()) {
    // Le rang plus deux : le tableau part de zéro, et le fichier a une ligne
    // d'entête. C'est le numéro que la personne voit dans son tableur.
    const numero = rang + 2;
    const nom = (ligne.nom ?? "").trim();

    if (!nom) {
      bilan.ecartes.push({ ligne: numero, nom: "", pourquoi: "Aucun nom." });
      continue;
    }

    const montant = (ligne.montant ?? "").trim();
    const nombre = montant
      ? Number(montant.replace(/[^\d,.-]/g, "").replace(",", "."))
      : null;

    const { error } = await supabase.from("contact").insert({
      nom,
      prenom: (ligne.prenom ?? "").trim() || null,
      email: (ligne.email ?? "").trim() || null,
      telephone: (ligne.telephone ?? "").trim() || null,
      entreprise: (ligne.entreprise ?? "").trim() || null,
      source: (ligne.source ?? "").trim() || null,
      notes: (ligne.notes ?? "").trim() || null,
      montant: nombre !== null && Number.isFinite(nombre) ? nombre : null,
      etape_id: etapeId,
    });

    if (error) {
      bilan.ecartes.push({ ligne: numero, nom, pourquoi: messageDe(error) });
      continue;
    }

    bilan.ajoutes += 1;
  }

  rafraichir();
  return bilan;
}
