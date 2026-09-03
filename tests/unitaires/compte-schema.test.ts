import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Le code ne doit lire de `compte` que des colonnes qu'`install.sql` crée.
 *
 * **Ce test est né d'une panne, et elle tombait au pire moment.** Le socle
 * lisait `compte.role`, hérité du portail dont cet outil est copié, mais
 * `install.sql` ne créait pas cette colonne. Rien ne le disait : ni la
 * compilation, qui ne connaît pas la base, ni les tests, qui n'y touchaient
 * pas, ni l'installation, qui écrit dans `compte` sans jamais le relire. La
 * panne apparaissait à la toute première connexion, juste après que
 * l'installateur ait posé son compte, sous la forme d'une erreur serveur sans
 * explication.
 *
 * La lecture est textuelle, et c'est le bon niveau ici : ce qu'on veut
 * attraper est un écart entre deux fichiers du dépôt, pas un comportement de
 * Postgres. Une base de test le dirait aussi, mais seulement à qui en a une.
 */
const RACINE = join(import.meta.dirname, "..", "..");

function lire(chemin: string): string {
  return readFileSync(join(RACINE, chemin), "utf8");
}

/** Les colonnes de `create table compte (...)`, dans install.sql. */
function colonnesDeCompte(): string[] {
  const sql = lire("install.sql");
  const debut = sql.indexOf("create table compte (");
  expect(debut, "install.sql ne crée pas la table compte").toBeGreaterThan(-1);

  const corps = sql.slice(debut + "create table compte (".length, sql.indexOf(");", debut));

  return corps
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter((ligne) => ligne !== "" && !ligne.startsWith("--"))
    .map((ligne) => ligne.split(/\s+/)[0]);
}

/** Les colonnes demandées par les `.select("...")` posés sur `compte`. */
function colonnesLues(chemin: string): string[] {
  const source = lire(chemin);
  const table = source.indexOf('.from("compte")');
  if (table === -1) return [];

  const selection = /\.select\("([^"]+)"\)/.exec(source.slice(table));
  if (!selection) return [];

  return selection[1].split(",").map((colonne) => colonne.trim());
}

describe("les colonnes de compte lues par le code", () => {
  const existantes = colonnesDeCompte();

  it.each(["lib/auth/compte.ts", "app/connexion/actions.ts"])(
    "%s ne demande que des colonnes qu'install.sql crée",
    (chemin) => {
      const lues = colonnesLues(chemin);
      expect(lues.length, `${chemin} ne lit plus compte`).toBeGreaterThan(0);

      for (const colonne of lues) {
        expect(existantes, `${chemin} lit compte.${colonne}`).toContain(colonne);
      }
    },
  );
});
