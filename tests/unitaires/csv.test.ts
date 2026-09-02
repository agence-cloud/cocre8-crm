import { describe, it, expect } from "vitest";
import {
  devinerLeSeparateur,
  lireCsv,
  proposerLaCorrespondance,
} from "@/lib/contact/csv";

describe("devinerLeSeparateur", () => {
  it("reconnaît le point-virgule d'un tableur français", () => {
    expect(devinerLeSeparateur("Nom;Prénom;Email")).toBe(";");
  });

  it("reconnaît la virgule d'un tableur anglais", () => {
    expect(devinerLeSeparateur("Name,First name,Email")).toBe(",");
  });

  it("ne prend pas une virgule protégée pour un séparateur", () => {
    // « Dupont, Jean » dans une seule cellule ne fait pas de la virgule le
    // séparateur du fichier : sans les guillemets, tout le fichier se
    // découperait de travers.
    expect(devinerLeSeparateur('"Dupont, Jean";contact@exemple.fr')).toBe(";");
  });
});

describe("lireCsv", () => {
  it("sépare l'entête des lignes", () => {
    const tableau = lireCsv("Nom;Email\nDupont;jean@exemple.fr\nMartin;lea@exemple.fr");

    expect(tableau.entetes).toEqual(["Nom", "Email"]);
    expect(tableau.lignes).toHaveLength(2);
    expect(tableau.lignes[1]).toEqual(["Martin", "lea@exemple.fr"]);
  });

  it("garde un retour à la ligne à l'intérieur d'une cellule", () => {
    // Une note sur deux lignes couperait le contact en deux avec un
    // split("\n") naïf, et décalerait toute la suite du fichier.
    const tableau = lireCsv('Nom;Notes\nDupont;"Rappeler jeudi.\nIl a un budget."');

    expect(tableau.lignes).toHaveLength(1);
    expect(tableau.lignes[0][1]).toContain("Rappeler jeudi.");
    expect(tableau.lignes[0][1]).toContain("Il a un budget.");
  });

  it("rend un guillemet doublé à sa valeur simple", () => {
    const tableau = lireCsv('Nom\n"Le ""Bistrot"" du coin"');
    expect(tableau.lignes[0][0]).toBe('Le "Bistrot" du coin');
  });

  it("retire le marqueur d'octets qu'Excel pose en tête", () => {
    // Sans ce retrait, la première colonne s'appelle « ﻿Nom » et ne
    // correspond à aucun synonyme connu.
    const tableau = lireCsv("﻿Nom;Email\nDupont;jean@exemple.fr");
    expect(tableau.entetes[0]).toBe("Nom");
  });

  it("ne tombe pas sur un fichier vide", () => {
    expect(lireCsv("")).toEqual({ entetes: [], lignes: [] });
  });
});

describe("proposerLaCorrespondance", () => {
  it("reconnaît les entêtes courantes, quelle que soit la casse", () => {
    const proposition = proposerLaCorrespondance(["NOM", "E-Mail", "Téléphone"]);

    expect(proposition[0]).toBe("nom");
    expect(proposition[1]).toBe("email");
    expect(proposition[2]).toBe("telephone");
  });

  it("n'attribue jamais deux fois la même colonne de destination", () => {
    // Un fichier avec « Nom » et « Société » proposerait deux fois « nom » :
    // la seconde écraserait la première à l'import, sans rien dire.
    const proposition = proposerLaCorrespondance(["Nom", "Société"]);
    const cibles = Object.values(proposition);

    expect(new Set(cibles).size).toBe(cibles.length);
  });

  it("laisse sans proposition une colonne qu'il ne reconnaît pas", () => {
    const proposition = proposerLaCorrespondance(["Couleur préférée"]);
    expect(proposition[0]).toBeUndefined();
  });
});
