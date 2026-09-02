/**
 * La lecture d'un fichier CSV, écrite à la main.
 *
 * **Pourquoi pas une librairie.** Un CSV exporté par un tableur tient en trois
 * règles : les guillemets protègent le séparateur, deux guillemets à
 * l'intérieur en valent un, et la fin de ligne compte pour rien entre
 * guillemets. Une dépendance pour ça, dans un outil qu'on donne et que
 * personne ne mettra à jour, coûte plus qu'elle ne rapporte.
 *
 * **Le séparateur se devine.** Un tableur français exporte en point-virgule,
 * un tableur anglais en virgule, et l'utilisateur ne sait ni lequel il a ni
 * que la question existe. On compte les deux sur la première ligne, le plus
 * fréquent gagne.
 */

const SEPARATEURS = [";", ",", "\t"] as const;

export function devinerLeSeparateur(premiereLigne: string): string {
  let meilleur = ";";
  let compte = -1;

  for (const candidat of SEPARATEURS) {
    // Hors guillemets seulement : « Dupont, Jean » ne fait pas de la virgule
    // un séparateur.
    const combien = decouper(premiereLigne, candidat).length;
    if (combien > compte) {
      compte = combien;
      meilleur = candidat;
    }
  }

  return meilleur;
}

/** Découpe une ligne en respectant les guillemets. */
function decouper(ligne: string, separateur: string): string[] {
  const cellules: string[] = [];
  let courante = "";
  let entreGuillemets = false;

  for (let rang = 0; rang < ligne.length; rang += 1) {
    const caractere = ligne[rang];

    if (caractere === '"') {
      if (entreGuillemets && ligne[rang + 1] === '"') {
        courante += '"';
        rang += 1;
      } else {
        entreGuillemets = !entreGuillemets;
      }
      continue;
    }

    if (caractere === separateur && !entreGuillemets) {
      cellules.push(courante);
      courante = "";
      continue;
    }

    courante += caractere;
  }

  cellules.push(courante);
  return cellules.map((cellule) => cellule.trim());
}

/**
 * Découpe le fichier entier en lignes, guillemets respectés.
 *
 * Une cellule peut contenir un retour à la ligne, dans une adresse ou une
 * note : un `split("\n")` naïf couperait le contact en deux et décalerait
 * toute la suite du fichier.
 */
function lignesDe(contenu: string): string[] {
  const lignes: string[] = [];
  let courante = "";
  let entreGuillemets = false;

  for (let rang = 0; rang < contenu.length; rang += 1) {
    const caractere = contenu[rang];

    if (caractere === '"') {
      entreGuillemets = !entreGuillemets;
      courante += caractere;
      continue;
    }

    if ((caractere === "\n" || caractere === "\r") && !entreGuillemets) {
      if (caractere === "\r" && contenu[rang + 1] === "\n") rang += 1;
      if (courante.trim()) lignes.push(courante);
      courante = "";
      continue;
    }

    courante += caractere;
  }

  if (courante.trim()) lignes.push(courante);
  return lignes;
}

export type Tableau = { entetes: string[]; lignes: string[][] };

export function lireCsv(contenu: string): Tableau {
  // Le marqueur d'ordre des octets, qu'Excel pose en tête de ses exports. Sans
  // ce retrait, la première colonne s'appelle « ﻿Nom » et ne correspond à
  // rien.
  const propre = contenu.replace(/^﻿/, "");
  const lignes = lignesDe(propre);
  if (lignes.length === 0) return { entetes: [], lignes: [] };

  const separateur = devinerLeSeparateur(lignes[0]);
  const [entete, ...reste] = lignes;

  return {
    entetes: decouper(entete, separateur),
    lignes: reste.map((ligne) => decouper(ligne, separateur)),
  };
}

/** Les colonnes de la fiche contact qu'un import peut remplir. */
export const CIBLES = [
  { cle: "nom", libelle: "Nom", obligatoire: true },
  { cle: "prenom", libelle: "Prénom", obligatoire: false },
  { cle: "email", libelle: "Email", obligatoire: false },
  { cle: "telephone", libelle: "Téléphone", obligatoire: false },
  { cle: "entreprise", libelle: "Entreprise", obligatoire: false },
  { cle: "montant", libelle: "Montant", obligatoire: false },
  { cle: "source", libelle: "Source", obligatoire: false },
  { cle: "notes", libelle: "Notes", obligatoire: false },
] as const;

/**
 * Devine à quelle colonne de la fiche correspond chaque colonne du fichier.
 *
 * Une proposition, jamais une décision : l'écran montre le résultat et laisse
 * tout corriger. C'est ce qui évite de demander huit choix à quelqu'un dont le
 * fichier s'appelle déjà « Nom », « Email », « Téléphone ».
 */
const SYNONYMES: Record<string, string[]> = {
  nom: ["nom", "name", "last name", "nom de famille", "lastname", "société", "societe"],
  prenom: ["prenom", "prénom", "first name", "firstname"],
  email: ["email", "e-mail", "mail", "courriel", "adresse email"],
  telephone: ["telephone", "téléphone", "tel", "phone", "mobile", "portable"],
  entreprise: ["entreprise", "company", "societe", "société", "organisation"],
  montant: ["montant", "amount", "valeur", "prix", "budget", "ca"],
  source: ["source", "origine", "canal", "provenance"],
  notes: ["notes", "note", "commentaire", "commentaires", "remarques"],
};

export function proposerLaCorrespondance(entetes: string[]): Record<number, string> {
  const proposition: Record<number, string> = {};
  const pris = new Set<string>();

  entetes.forEach((entete, rang) => {
    const propre = entete.toLowerCase().trim();
    for (const [cible, mots] of Object.entries(SYNONYMES)) {
      if (pris.has(cible)) continue;
      if (mots.includes(propre)) {
        proposition[rang] = cible;
        pris.add(cible);
        return;
      }
    }
  });

  return proposition;
}
