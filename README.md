# CRM

Tes contacts, leurs étapes, et tes chiffres. Un tableau où chacun avance de
colonne en colonne, une fiche par personne, et de quoi savoir où tu en es.

Un outil que tu installes chez toi, sur ton propre hébergement et ta propre
base. Personne d'autre n'a accès à tes données, nous compris.

## Ce qu'il fait

**Tes contacts.** Tu en ajoutes un à la main, ou tu importes ton fichier
existant en CSV. Chaque fiche porte ce que tout le monde a (nom, email,
téléphone, entreprise, montant, source) et ce que toi seul as : tu ajoutes tes
propres champs, et ils apparaissent sur toutes les fiches.

**Tes étapes.** Un pipe en colonnes, et un contact qu'on déplace de l'une à
l'autre. Les étapes sont les tiennes : tu les renommes, tu en ajoutes, tu en
retires.

**Tes chiffres.** Combien de contacts à chaque étape, combien sont entrés ce
mois-ci, combien sont allés jusqu'au bout, et ce que pèse ton pipe.

## L'installer

Quatre étapes, une vingtaine de minutes, aucune ligne de commande. Le
[README du portail](#) décrit exactement le même chemin.

1. **Crée un projet Supabase**, gratuit, sur
   [supabase.com](https://supabase.com).
2. **Crée ta base.** Ouvre l'éditeur SQL, colle le contenu de
   [`install.sql`](./install.sql), exécute.
3. **Déploie l'app** sur Vercel, avec les trois valeurs de ton projet
   Supabase. Copie chaque clé avec le bouton de copie, jamais en sélectionnant
   le texte : Supabase les affiche masquées, et une clé masquée a exactement
   la longueur de la vraie.
4. **Crée ton compte.** Le premier compte créé devient le tien, et la porte se
   referme derrière toi pour toujours.

## Ce qu'il ne fait pas

Ce n'est ni un espace client ni un outil de facturation. Tes contacts ne s'y
connectent jamais, il n'envoie aucun email, et il ne se relie à aucun autre
outil. Il fait une chose, ton carnet et ton pipe.

## La pile

Next.js, Supabase, Tailwind. Tout le code est là, tu peux le modifier.

## Licence

MIT. Fais-en ce que tu veux, y compris pour tes clients à toi.
