"use server";

/**
 * Les réglages du CRM : ses étapes, ses champs, et son nom.
 *
 * **Chaque liste s'envoie entière, en JSON dans un champ caché.** Des noms de
 * champs indexés se seraient décalés au premier retrait de ligne. Une liste
 * est une valeur, elle voyage d'un bloc.
 *
 * **Ce qui est supprimé se vérifie avant, jamais après.** La base efface en
 * cascade : retirer un champ emporte ce que tous les contacts y ont répondu.
 * Le refus arrive donc ici, avec le geste à faire à la place.
 */

import { revalidatePath } from "next/cache";
import { exigerCompte } from "@/lib/auth/compte";
import { creerClientServeur } from "@/lib/supabase/serveur";
import { ecrireReglages } from "@/lib/reglages/requetes";

export type EtatListe = { erreur: string | null; enregistre: boolean };

function lignesDe<T>(donnees: FormData): T[] {
  try {
    const brut = JSON.parse(String(donnees.get("lignes") ?? "[]"));
    return Array.isArray(brut) ? (brut as T[]) : [];
  } catch {
    return [];
  }
}

function echec(erreur: string): EtatListe {
  return { erreur, enregistre: false };
}

type LigneEtape = { id?: string; nom: string; issue: string };

export async function enregistrerLesEtapes(
  _precedent: EtatListe,
  donnees: FormData,
): Promise<EtatListe> {
  await exigerCompte();
  const supabase = await creerClientServeur();
  const lignes = lignesDe<LigneEtape>(donnees);

  if (lignes.some((ligne) => !ligne.nom.trim())) {
    return echec("Une étape sans nom ne se distinguerait pas des autres.");
  }
  if (lignes.length === 0) {
    return echec("Garde au moins une étape : un pipe sans colonne n'affiche rien.");
  }

  const { data: existantes } = await supabase.from("etape").select("id");
  const gardees = new Set(lignes.map((ligne) => ligne.id).filter(Boolean));
  const aRetirer = (existantes ?? []).filter((etape) => !gardees.has(etape.id));

  // Un contact posé sur une étape qu'on retire retombe à « sans étape », il ne
  // disparaît pas : la base le prévoit. Mais autant le dire, parce que le
  // contact sort alors du pipe sans que personne l'ait décidé.
  for (const etape of aRetirer) {
    const { count } = await supabase
      .from("contact")
      .select("id", { count: "exact", head: true })
      .eq("etape_id", etape.id);

    if ((count ?? 0) > 0) {
      return echec(
        `Une étape que tu retires porte ${count} contact${(count ?? 0) > 1 ? "s" : ""}. Déplace-les d'abord, sinon ils sortiraient du pipe.`,
      );
    }
  }

  if (aRetirer.length > 0) {
    const { error } = await supabase
      .from("etape")
      .delete()
      .in("id", aRetirer.map((etape) => etape.id));
    if (error) return echec(error.message);
  }

  for (const [rang, ligne] of lignes.entries()) {
    const champs = { nom: ligne.nom.trim(), issue: ligne.issue, ordre: rang + 1 };
    const { error } = ligne.id
      ? await supabase.from("etape").update(champs).eq("id", ligne.id)
      : await supabase.from("etape").insert(champs);
    if (error) return echec(error.message);
  }

  revalidatePath("/", "layout");
  return { erreur: null, enregistre: true };
}

type LigneChamp = {
  id?: string;
  libelle: string;
  aide: string;
  type: string;
  options: string;
  actif: boolean;
};

export async function enregistrerLesChamps(
  _precedent: EtatListe,
  donnees: FormData,
): Promise<EtatListe> {
  await exigerCompte();
  const supabase = await creerClientServeur();
  const lignes = lignesDe<LigneChamp>(donnees);

  if (lignes.some((ligne) => !ligne.libelle.trim())) {
    return echec("Un champ sans nom ne demanderait rien à personne.");
  }

  const { data: existants } = await supabase.from("champ").select("id");
  const gardes = new Set(lignes.map((ligne) => ligne.id).filter(Boolean));
  const aRetirer = (existants ?? []).filter((champ) => !gardes.has(champ.id));

  // Retirer un champ emporte ce que tous les contacts y ont répondu, en
  // cascade et sans retour. On refuse, et on dit le geste qui garde tout :
  // décocher « actif » retire le champ des fiches et laisse les réponses.
  for (const champ of aRetirer) {
    const { count } = await supabase
      .from("valeur_champ")
      .select("id", { count: "exact", head: true })
      .eq("champ_id", champ.id);

    if ((count ?? 0) > 0) {
      return echec(
        `Un champ que tu retires porte ${count} réponse${(count ?? 0) > 1 ? "s" : ""}. Décoche-le plutôt : il disparaît des fiches et les réponses restent.`,
      );
    }
  }

  if (aRetirer.length > 0) {
    const { error } = await supabase
      .from("champ")
      .delete()
      .in("id", aRetirer.map((champ) => champ.id));
    if (error) return echec(error.message);
  }

  for (const [rang, ligne] of lignes.entries()) {
    const options =
      ligne.type === "choix"
        ? ligne.options.split(",").map((o) => o.trim()).filter(Boolean)
        : null;

    const champs = {
      libelle: ligne.libelle.trim(),
      aide: ligne.aide.trim() || null,
      type: ligne.type,
      options,
      actif: ligne.actif,
      ordre: rang + 1,
    };

    const { error } = ligne.id
      ? await supabase.from("champ").update(champs).eq("id", ligne.id)
      : await supabase.from("champ").insert(champs);
    if (error) return echec(error.message);
  }

  revalidatePath("/", "layout");
  return { erreur: null, enregistre: true };
}

export type EtatReglages = { erreur: string | null; enregistre: boolean };

export async function enregistrerLesReglages(
  _precedent: EtatReglages,
  donnees: FormData,
): Promise<EtatReglages> {
  await exigerCompte();

  const texte = (nom: string) => String(donnees.get(nom) ?? "").trim();

  try {
    await ecrireReglages({
      nom_programme: texte("nom_programme") || "Mon CRM",
      devise: texte("devise") || "€",
    });
  } catch (erreur) {
    return {
      erreur: erreur instanceof Error ? erreur.message : "Enregistrement impossible.",
      enregistre: false,
    };
  }

  revalidatePath("/", "layout");
  return { erreur: null, enregistre: true };
}
