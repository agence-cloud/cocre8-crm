import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Contact } from "@/lib/contact/types";
import type { Etape } from "@/lib/etape/types";

export type Entree = { mois: string; combien: number };

/**
 * Ce qui est entré dans le pipe, mois par mois, sur un an.
 *
 * Compté sur la **première** ligne d'historique de chaque contact, et non sur
 * sa date de création : un contact importé d'un vieux fichier a été créé
 * aujourd'hui mais est entré il y a deux ans. Compter les créations
 * ferait apparaître mille entrées le jour de l'import.
 */
export async function lireEntreesParMois(): Promise<Entree[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("etape_historique")
    .select("contact_id, entre_le")
    .order("entre_le");

  if (error) throw new Error(`Lecture de l'historique impossible : ${error.message}`);

  const premiere = new Map<string, string>();
  for (const ligne of data ?? []) {
    if (!premiere.has(ligne.contact_id)) premiere.set(ligne.contact_id, ligne.entre_le);
  }

  const compte = new Map<string, number>();
  for (const date of premiere.values()) {
    const mois = date.slice(0, 7);
    compte.set(mois, (compte.get(mois) ?? 0) + 1);
  }

  // Les douze derniers mois, y compris ceux à zéro : un trou dans une courbe
  // se lit comme une absence de donnée, un zéro se lit comme un mois creux.
  const sortie: Entree[] = [];
  const curseur = new Date();
  curseur.setDate(1);
  for (let recul = 11; recul >= 0; recul -= 1) {
    const mois = new Date(curseur.getFullYear(), curseur.getMonth() - recul, 1);
    const cle = `${mois.getFullYear()}-${String(mois.getMonth() + 1).padStart(2, "0")}`;
    sortie.push({ mois: cle, combien: compte.get(cle) ?? 0 });
  }

  return sortie;
}

export type Chiffres = {
  total: number;
  enCours: number;
  gagnes: number;
  perdus: number;
  /** Ce que pèsent les affaires encore ouvertes. */
  pipe: number;
  /** Ce qu'ont pesé les affaires gagnées. */
  gagne: number;
  /** Sur cent affaires closes, combien sont gagnées. Nul si aucune ne l'est. */
  conversion: number | null;
};

/**
 * Les chiffres, calculés à partir de ce que les écrans ont déjà chargé.
 *
 * Une fonction pure plutôt qu'une requête d'agrégation : la liste des contacts
 * est déjà en mémoire, et une seconde requête pourrait donner un total qui ne
 * corresponde pas à ce qui est affiché juste à côté.
 */
export function chiffres(contacts: Contact[], etapes: Etape[]): Chiffres {
  const issuePar = new Map(etapes.map((etape) => [etape.id, etape.issue]));
  const issueDe = (contact: Contact) =>
    contact.etape_id ? (issuePar.get(contact.etape_id) ?? "en_cours") : "en_cours";

  const enCours = contacts.filter((c) => issueDe(c) === "en_cours");
  const gagnes = contacts.filter((c) => issueDe(c) === "gagne");
  const perdus = contacts.filter((c) => issueDe(c) === "perdu");
  const somme = (liste: Contact[]) =>
    liste.reduce((total, contact) => total + Number(contact.montant ?? 0), 0);

  const closes = gagnes.length + perdus.length;

  return {
    total: contacts.length,
    enCours: enCours.length,
    gagnes: gagnes.length,
    perdus: perdus.length,
    pipe: somme(enCours),
    gagne: somme(gagnes),
    conversion: closes === 0 ? null : Math.round((gagnes.length / closes) * 100),
  };
}
