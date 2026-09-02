# CRM

Tes contacts, leurs étapes, et tes chiffres. Un tableau où chacun avance de
colonne en colonne, une fiche par personne, et de quoi savoir où tu en es.

Un outil que tu installes chez toi, sur ton propre hébergement et ta propre
base. Personne d'autre n'a accès à tes données, nous compris.

## Ce qu'il fait

**Tes contacts.** Tu en ajoutes un à la main, ou tu importes ton fichier
existant. Chaque fiche porte ce que tout le monde a (nom, email, téléphone,
entreprise, montant, source) et ce que toi seul as : tu ajoutes tes propres
champs, et ils apparaissent sur toutes les fiches.

**Ton pipe.** Des colonnes, et une carte qu'on fait glisser de l'une à
l'autre. Les étapes sont les tiennes : tu les renommes, tu en ajoutes, tu en
retires.

**Tes chiffres.** Ce que pèse ton pipe, ce que tu as gagné, ton taux de
conversion, qui se trouve à chaque étape, et combien de contacts entrent
chaque mois.

## L'import de ton fichier

Le geste du premier jour. Tu prends le fichier CSV que ton tableur exporte,
l'app devine à quelle colonne de la fiche correspond chacune des tiennes, te
montre les trois premières lignes telles qu'elles arriveront, et tu corriges
ce qui ne va pas avant que rien ne soit créé.

**Rien n'est jamais écrasé.** Un contact dont l'email est déjà chez toi est
écarté, pas mis à jour, et l'écran te dit lesquels avec le numéro de ligne de
ton tableur. Un import est le geste le plus facile à relancer par erreur.

## Le récupérer

Tu n'as rien à télécharger. Le bouton de l'étape 3 se charge de tout : il te
crée ta copie du code sur GitHub, et il la met en ligne dans la foulée.

Si tu préfères avoir le code sous les yeux d'abord, le bouton vert
**« Use this template »** en haut de cette page t'en fait une copie, et
« Code » puis « Download ZIP » te la met sur ton ordinateur.

## L'installer

Quatre étapes, une quinzaine de minutes, aucune ligne de commande.

### 1. Ta base de données

Va sur [supabase.com](https://supabase.com), crée un compte gratuit, puis
« New project ». Donne-lui un nom, choisis une région proche de toi, et note
le mot de passe qu'il te demande quelque part. Attends deux minutes qu'il se
prépare.

C'est ta base : elle t'appartient, et personne d'autre n'y a accès.

### 2. Créer les tables

Ouvre le fichier [`install.sql`](./install.sql) sur cette page, et clique sur
l'icône de copie en haut à droite du fichier.

Retourne sur Supabase, clique sur **SQL Editor** dans la colonne de gauche,
colle, et clique sur **Run**. C'est fait. Tu n'as rien à comprendre dans ce
fichier.

### 3. Mettre l'app en ligne

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fagence-cloud%2Fcocre8-crm&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Les%20trois%20valeurs%20de%20ton%20projet%20Supabase&project-name=crm&repository-name=crm)

Ce bouton fait tout d'un coup : il te crée un compte Vercel si tu n'en as pas,
il pose ta copie du code sur ton GitHub, et il met l'app en ligne. Il te
demande d'abord trois valeurs. Elles sont toutes dans le projet Supabase que
tu viens de créer :

| Ce que Vercel demande | Où le trouver dans Supabase |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings, **Data API**, ligne « Project URL » |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings, **API Keys**, la clé `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | Au même endroit, la clé `service_role` |

**Copie chaque clé avec le petit bouton de copie**, jamais en sélectionnant le
texte à l'écran. Supabase les affiche masquées avec des points, et une clé
masquée a exactement la même longueur que la vraie : rien ne permet de les
distinguer à l'oeil.

La troisième, `service_role`, est un secret. Elle ne sert qu'à créer ton tout
premier compte, et elle ne doit jamais sortir de chez toi.

Si tu te trompes sur l'une des deux premières, la construction s'arrête et te
dit en français laquelle cloche et pourquoi. La troisième n'est lue qu'au
moment de créer ton compte, à l'étape suivante, et l'écran te le dira aussi.

Dans les deux cas : corrige la valeur chez Vercel, puis clique sur
**Redeploy**. Une valeur corrigée ne prend effet qu'au déploiement suivant.

### 4. Ton compte

Ouvre l'adresse que Vercel te donne. Un écran te demande ton nom, ton email et
un mot de passe.

Ce premier compte devient le tien, et **la porte se referme derrière toi pour
toujours** : il n'y a pas de formulaire d'inscription sur ton portail,
personne d'autre ne peut s'y créer un compte.

Importe ensuite ton fichier de contacts, ou ajoute le premier à la main.

## Le faire tourner sur ton ordinateur

Facultatif. L'app marche très bien sans que tu ouvres jamais un terminal. Ceci
ne sert qu'à modifier le code.

Il te faut [Node.js](https://nodejs.org), puis dans le dossier :

```
npm install
cp .env.example .env.local     # puis remplis les trois valeurs
npm run dev
```

L'app répond sur `http://localhost:3000`, contre la même base que ta version
en ligne.

## Si quelque chose ne répond pas

Ouvre `/diagnostic` sur ton installation, par exemple
`https://ton-app.vercel.app/diagnostic`. La page dit l'adresse qu'elle
interroge, si tes trois valeurs sont bien arrivées, et si ton projet Supabase
lui répond. C'est la première chose à regarder quand la connexion refuse : une
adresse ou une clé fausse produit exactement le même écran qu'un mot de passe
faux.

Trois pièges qui coûtent une soirée chacun :

- **Copie tes clés avec le bouton de copie**, jamais en sélectionnant le texte
  affiché. Supabase les montre masquées, et une clé masquée a exactement la
  longueur de la vraie : rien ne distingue les deux à l'oeil, et l'app se
  contente de refuser la connexion.

- Sur Vercel, une variable de type **Secret** n'est pas lisible pendant la
  construction. Les deux valeurs `NEXT_PUBLIC_` doivent être de type
  **Config**, sinon elles arrivent vides sans que rien ne le montre. Seule
  `SUPABASE_SERVICE_ROLE_KEY` reste un Secret.
- Une valeur corrigée ne prend effet qu'au **déploiement suivant**. Corrige,
  puis redéploie.

## Le régler

Tout se règle depuis l'app : le nom de ton outil, ta devise, tes étapes et
leur ordre, et les champs que tu ajoutes aux fiches.

Deux suppressions sont refusées, et le message dit quoi faire à la place :
retirer une étape qui porte encore des contacts, et retirer un champ auquel
des contacts ont répondu. Dans le second cas, décoche-le : il disparaît des
fiches et les réponses restent.

## Ce qu'il ne fait pas

Ce n'est ni un espace client ni un outil de facturation. Tes contacts ne s'y
connectent jamais, il n'envoie aucun email, et il ne se relie à aucun autre
outil. Il fait une chose, ton carnet et ton pipe.

## La pile

Next.js, Supabase, Tailwind. Tout le code est là, tu peux le modifier.

## Licence

MIT. Fais-en ce que tu veux, y compris pour tes clients à toi.
