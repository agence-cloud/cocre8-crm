# CLAUDE.md : CRM

## Ce que c'est

Un outil gratuit, donné à des indépendants. Chacun l'installe chez lui, sur
son propre hébergement et sa propre base : **il n'y a pas de version hébergée,
pas de multi-locataire, et personne d'autre ne voit ses données.**

**Rien de l'éditeur ne doit se voir dedans.** Ni ses couleurs, ni sa police,
ni son logotype, ni une signature au pied d'un écran. `npm run verifier`
refuse toute réapparition de la marque hors du README et de la licence.

## D'où il vient

Copie propre du socle du portail client, prise une fois le 2026-09-02.
L'authentification, le design, les clients Supabase, les réglages, l'écran
d'installation et le diagnostic viennent de là. Les deux dépôts ne partagent
aucun code : une correction ici ne remonte nulle part, et c'est voulu.

## Un seul compte, et c'est tout le modèle

Le portail arbitrait entre `admin` et `membre`. Ici l'outil appartient à qui
l'installe, et ses contacts ne s'y connectent jamais. Les permissions se
réduisent donc à une question, `est_le_proprietaire()`, ce qui rend le schéma
trois fois plus court.

Une seule garde côté application, `exigerCompte`. **Elle s'appelle en tête de
chaque page ET de chaque action serveur** : une action s'appelle par requête
HTTP, elle ne traverse aucun layout.

**Un seul lecteur de la clé de service**, `lib/auth/installation.ts`, qui crée
le tout premier compte. La liste se vérifie par
`grep -rn "supabase/service" lib modules app`, jamais par une liste écrite
qu'il faudrait croire.

## Trois choix de schéma qui portent le reste

**Les étapes sont une table, pas un `enum`.** Changer une valeur d'`enum`
demande de recréer le type et de convertir les tables qui s'en servent : ce
n'est pas un écran, c'est une migration. Or c'est la première chose que
quelqu'un voudra changer.

**Les champs sur mesure vivent dans `champ` et `valeur_champ`**, avec une
seule colonne texte pour tous les types. Une colonne par type serait plus
juste et rendrait la lecture d'une fiche illisible : cinq jointures pour cinq
lignes. Le type vit sur le champ, la valeur est un texte.

**`etape_historique` se remplit par un déclencheur, jamais par
l'application.** Sans elle aucune statistique n'est possible, l'étape d'un
contact ne disant que son présent. Elle **fige le nom de l'étape au passage** :
sans cette copie, l'entonnoir de l'an dernier deviendrait illisible le jour où
quelqu'un réorganise son pipe.

## Ce qui se règle, et ce qui ne se règle pas

**Se règle :** le nom de l'outil, la devise, les étapes et leur ordre, les
champs des fiches.

**Deux suppressions sont refusées**, et le message dit quoi faire à la place :
retirer une étape qui porte des contacts (ils sortiraient du pipe sans que
personne l'ait décidé), et retirer un champ auquel des contacts ont répondu
(décocher « actif » le retire des fiches et garde les réponses).

**Ne se règle pas :** l'habillage, le tutoiement, la structure.

## Conventions

- **Français** partout : commits, commentaires, noms de branches, docs. Le
  code (variables, fonctions) reste en anglais.
- **Tutoiement** dans toute l'interface.
- **Interdit : les tirets longs** (cadratin et demi-cadratin). Virgules,
  deux-points ou parenthèses à la place.
- **Commits atomiques.** Un commit = un changement cohérent.

## Deux pièges qui ont coûté cher au portail

- **Chez Vercel, une variable de type « Secret » n'est pas lisible à la
  construction**, or les `NEXT_PUBLIC_` y sont recopiées. `next.config.ts`
  refuse donc de construire sans elles, et vérifie leur forme.
- **Une clé copiée en sélectionnant le texte affiché est masquée**, et une clé
  masquée a exactement la longueur de la vraie. Le même `next.config.ts`
  refuse tout caractère hors ASCII imprimable dans la clé.

## L'outillage

- `npm test` lance les tests unitaires.
- `npm run verifier` refuse de laisser partir une donnée de l'éditeur.
- **Sur le schéma `public`, révoquer avant d'accorder.** Supabase donne par
  défaut INSERT, UPDATE et DELETE à `anon` et `authenticated` sur toute table
  ou vue nouvelle. Un `grant select` seul ajoute un droit sans en retirer
  aucun.
- **Après toute migration, lancer le conseiller de sécurité de Supabase.**
