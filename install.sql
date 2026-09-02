-- =====================================================================
--  CRM : le schéma complet, en une fois.
--
--  À coller dans l'éditeur SQL de ton projet Supabase, puis exécuter.
--  Une seule fois, sur une base neuve.
--
--  Il crée les tables, les permissions par ligne, et un jeu de départ que
--  tu pourras renommer entièrement depuis l'app.
-- =====================================================================


-- ---------------------------------------------------------------------
--  1. Les tables
--
--  **Un seul compte, celui de qui installe.** Pas de rôle à arbitrer, pas
--  d'espace client à cloisonner : ce CRM est l'outil de son propriétaire,
--  et ses contacts ne s'y connectent jamais. Les permissions se réduisent
--  donc à une seule question, « es-tu le propriétaire », et c'est ce qui
--  rend ce schéma trois fois plus court que celui du portail.
-- ---------------------------------------------------------------------

-- Le compte de connexion. Une seule ligne, à jamais.
create table compte (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null,
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

-- Les étapes du pipe, dans l'ordre où on les traverse.
--
-- **Une table et non un `enum`.** Changer une valeur d'`enum` demande de
-- recréer le type et de convertir les tables qui s'en servent : ce n'est pas
-- un écran, c'est une migration. Or c'est exactement ce qu'un utilisateur
-- voudra changer en premier, ses étapes n'étant celles de personne d'autre.
create table etape (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  -- Le rang dans le pipe. Deux étapes peuvent le partager le temps d'une
  -- réorganisation, l'écran les départage alors par leur nom.
  ordre smallint not null default 0,
  -- Une étape de sortie ne compte pas dans le pipe en cours : elle dit que
  -- l'histoire est finie, gagnée ou perdue. C'est ce qui permet à un taux de
  -- conversion d'avoir un dénominateur qui veut dire quelque chose.
  issue text not null default 'en_cours'
    check (issue in ('en_cours', 'gagne', 'perdu')),
  cree_le timestamptz not null default now()
);

create index etape_ordre_idx on etape (ordre);

-- Un contact. Le coeur de l'outil, et volontairement maigre : tout ce qui
-- varie d'un métier à l'autre vit dans `champ` et `valeur_champ`.
--
-- L'étape passe à nul quand on la supprime, plutôt que d'emporter le contact
-- avec elle : perdre une étape est une erreur de réglage, perdre un carnet
-- d'adresses n'est pas rattrapable.
create table contact (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text,
  email text,
  telephone text,
  entreprise text,
  etape_id uuid references etape (id) on delete set null,
  -- Ce que vaut l'affaire, si on la chiffre. Nul est un état, pas un zéro :
  -- un contact sans montant n'est pas une affaire à zéro euro.
  montant numeric(10, 2),
  -- D'où il vient. Texte libre et non une table : une source n'a ni identité
  -- ni attribut, et une liste fermée se heurte au premier canal nouveau.
  source text,
  notes text,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

-- Unicité insensible à la casse, et non `email text unique` : sans elle,
-- Jean@exemple.fr et jean@exemple.fr coexisteraient comme deux contacts. Les
-- contacts sans email restent autorisés en plusieurs exemplaires, un carnet
-- d'adresses en portant toujours.
create unique index contact_email_unique on contact (lower(email))
  where email is not null;

create index contact_etape_idx on contact (etape_id);

-- Les champs que chacun ajoute à sa fiche contact.
--
-- **C'est ce qui remplace un schéma sur mesure.** Un coach sportif veut un
-- objectif de poids, un consultant veut un numéro de SIRET : aucun des deux
-- ne se règle en ajoutant une colonne, et un CRM figé sur les besoins de son
-- éditeur ne sert que lui.
create table champ (
  id uuid primary key default gen_random_uuid(),
  libelle text not null,
  aide text,
  type text not null check (type in ('texte_court', 'texte_long', 'nombre', 'date', 'choix')),
  -- Les options d'un champ de type `choix`, en JSON. Nul pour tous les autres.
  options jsonb,
  ordre smallint not null default 0,
  -- Désactivé plutôt que supprimé : retirer un champ emporte les valeurs
  -- saisies chez tous les contacts, et ça ne se rattrape pas.
  actif boolean not null default true
);

create table valeur_champ (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contact (id) on delete cascade,
  champ_id uuid not null references champ (id) on delete cascade,
  -- Une colonne texte pour tous les types. Une colonne par type serait plus
  -- juste et rendrait la lecture d'une fiche illisible : cinq jointures pour
  -- afficher cinq lignes. Le type vit sur le champ, la valeur est un texte.
  valeur text,
  unique (contact_id, champ_id)
);

create index valeur_champ_contact_idx on valeur_champ (contact_id);

-- Chaque passage d'une étape à une autre, daté.
--
-- **Sans cette table, aucune statistique n'est possible.** L'étape d'un
-- contact ne dit que son présent : elle ne sait pas dire combien sont passés
-- par « Devis envoyé » le mois dernier, ni combien de temps ils y sont
-- restés. C'est l'historique qui porte l'entonnoir, et il se remplit tout
-- seul par un déclencheur, jamais par l'application : une écriture qu'on peut
-- oublier finit par être oubliée.
create table etape_historique (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contact (id) on delete cascade,
  etape_id uuid references etape (id) on delete set null,
  -- Le nom au moment du passage, figé. L'étape peut être renommée ou
  -- supprimée plus tard : sans cette copie, l'entonnoir de l'an dernier
  -- deviendrait illisible le jour où quelqu'un réorganise son pipe.
  etape_nom text not null,
  entre_le timestamptz not null default now()
);

create index etape_historique_contact_idx on etape_historique (contact_id, entre_le);
create index etape_historique_date_idx on etape_historique (entre_le);

-- Les réglages de l'outil, en clé-valeur.
--
-- Une table clé-valeur plutôt qu'une table à une ligne et vingt colonnes :
-- chaque réglage nouveau serait sinon une migration, sur un outil qui n'en
-- reçoit plus une fois donné.
--
-- **Aucun secret n'entre ici.**
create table reglage (
  cle text primary key,
  valeur jsonb not null,
  modifie_le timestamptz not null default now()
);

-- La marque de la première mise en service, et le verrou qui l'accompagne.
--
-- Une seule ligne possible, à jamais : la clé primaire vaut `true` et la
-- contrainte interdit `false`. Le second appel se heurte donc à un doublon,
-- et c'est la base qui referme la porte, pas l'application.
create table installation (
  id boolean primary key default true check (id),
  faite_le timestamptz not null default now()
);


-- ---------------------------------------------------------------------
--  2. Les fonctions qui décident des permissions
-- ---------------------------------------------------------------------

-- Le propriétaire de l'outil, et la seule question que les politiques posent.
--
-- `security definer` : elle lit `compte`, qui est elle-même protégée. Sans
-- ça, toute politique qui l'appelle tournerait en rond.
create or replace function est_le_proprietaire() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from compte where id = auth.uid() and actif
  );
$$;

-- Répond à un anonyme, et c'est voulu : l'écran d'installation doit savoir
-- s'il a encore lieu d'être, et personne n'a de session à ce moment-là.
create or replace function installation_faite() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from installation); $$;

-- Le nom de l'outil, lu par l'écran de connexion avant toute session.
-- Une fonction à part plutôt que la table entière ouverte aux anonymes : les
-- réglages en porteront d'autres, et ceux-là ne regardent que leur
-- propriétaire.
create or replace function nom_de_loutil() returns text
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select valeur #>> '{}' from reglage where cle = 'nom_programme'),
    'Mon CRM'
  );
$$;


-- ---------------------------------------------------------------------
--  3. Les déclencheurs
-- ---------------------------------------------------------------------

create or replace function touche_modifie_le()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.modifie_le := now();
  return new;
end;
$$;

create trigger contact_modifie_le
before update on contact for each row
execute function touche_modifie_le();

-- L'email en minuscules, toujours, pour que l'index unique tienne sa
-- promesse quel que soit ce qu'on a tapé.
create or replace function normalise_email_contact()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.email := nullif(lower(trim(new.email)), '');
  return new;
end;
$$;

create trigger contact_normalise_email
before insert or update on contact for each row
execute function normalise_email_contact();

-- L'historique se remplit tout seul, à la création et à chaque changement
-- d'étape. Jamais depuis l'application : une écriture qu'on peut oublier
-- finit par être oubliée, et un entonnoir à trous ne se répare pas
-- rétroactivement.
create or replace function note_le_passage_detape()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_nom text;
begin
  if new.etape_id is null then
    return null;
  end if;

  if tg_op = 'UPDATE' and new.etape_id is not distinct from old.etape_id then
    return null;
  end if;

  select nom into v_nom from etape where id = new.etape_id;

  insert into etape_historique (contact_id, etape_id, etape_nom)
  values (new.id, new.etape_id, coalesce(v_nom, 'Étape retirée'));

  return null;
end;
$$;

create trigger contact_note_son_etape
after insert or update of etape_id on contact for each row
execute function note_le_passage_detape();


-- ---------------------------------------------------------------------
--  4. Les permissions par ligne
--
--  Chaque table est verrouillée, puis ouverte au seul propriétaire. Toutes
--  les politiques portent `to authenticated` : sans cette clause elles
--  s'appliqueraient au rôle `public`, anonyme compris.
-- ---------------------------------------------------------------------

alter table compte enable row level security;
alter table etape enable row level security;
alter table contact enable row level security;
alter table champ enable row level security;
alter table valeur_champ enable row level security;
alter table etape_historique enable row level security;
alter table reglage enable row level security;
alter table installation enable row level security;

create policy proprietaire_tout on etape for all to authenticated
  using (est_le_proprietaire()) with check (est_le_proprietaire());
create policy proprietaire_tout on contact for all to authenticated
  using (est_le_proprietaire()) with check (est_le_proprietaire());
create policy proprietaire_tout on champ for all to authenticated
  using (est_le_proprietaire()) with check (est_le_proprietaire());
create policy proprietaire_tout on valeur_champ for all to authenticated
  using (est_le_proprietaire()) with check (est_le_proprietaire());
create policy proprietaire_tout on etape_historique for all to authenticated
  using (est_le_proprietaire()) with check (est_le_proprietaire());
create policy proprietaire_tout on reglage for all to authenticated
  using (est_le_proprietaire()) with check (est_le_proprietaire());

-- Il lit son propre compte, et lui seul.
create policy lit_son_compte on compte
  for select to authenticated using (id = auth.uid());

-- Aucune politique sur `installation` : la table ne se lit ni ne s'écrit
-- depuis l'API. La fonction `installation_faite()` répond à sa place, et la
-- pose de la ligne passe par la clé de service, une seule fois.


-- ---------------------------------------------------------------------
--  5. La surface exposée
--
--  PostgREST expose toute fonction du schéma public. Le droit d'exécuter
--  arrive par deux chemins à la fois, et il faut couper les deux : `anon`
--  hérite de `PUBLIC`, et Supabase lui accorde en plus le droit en direct
--  sur toute fonction nouvelle du schéma. Révoquer à `PUBLIC` seul laisse
--  donc la porte ouverte, et révoquer à `anon` seul aussi.
--
--  Même règle sur les tables : Supabase donne par défaut INSERT, UPDATE et
--  DELETE à `anon` et `authenticated` sur toute table nouvelle du schéma
--  `public`. Un `grant select` seul ajoute un droit sans en retirer aucun.
-- ---------------------------------------------------------------------

revoke all on compte, etape, contact, champ, valeur_champ, etape_historique,
  reglage, installation from anon, authenticated;

grant select on compte to authenticated;
grant select, insert, update, delete on etape, contact, champ, valeur_champ,
  etape_historique, reglage to authenticated;

revoke execute on function public.est_le_proprietaire() from public, anon;
grant execute on function public.est_le_proprietaire() to authenticated;

-- Ces deux-là répondent à un anonyme, et c'est voulu : l'une dit si
-- l'installation a encore lieu d'être, l'autre donne le nom affiché sur
-- l'écran de connexion. Personne n'a de session à ces moments-là.
revoke execute on function public.installation_faite() from public;
grant execute on function public.installation_faite() to anon, authenticated;
revoke execute on function public.nom_de_loutil() from public;
grant execute on function public.nom_de_loutil() to anon, authenticated;

-- Les fonctions de déclencheur ne s'appellent pas : PostgreSQL les exécute
-- lui-même, sans vérifier le droit de l'appelant. Les exposer n'apporte rien.
revoke execute on function public.touche_modifie_le() from public, anon, authenticated;
revoke execute on function public.normalise_email_contact() from public, anon, authenticated;
revoke execute on function public.note_le_passage_detape() from public, anon, authenticated;


-- ---------------------------------------------------------------------
--  6. Le jeu de départ
--
--  Tout ce qui suit se renomme, se réécrit et se supprime depuis l'app.
--  Ce sont des valeurs de départ, pas une méthode.
-- ---------------------------------------------------------------------

insert into etape (nom, ordre, issue) values
  ('Nouveau', 1, 'en_cours'),
  ('Contacté', 2, 'en_cours'),
  ('Rendez-vous pris', 3, 'en_cours'),
  ('Proposition envoyée', 4, 'en_cours'),
  ('Client', 5, 'gagne'),
  ('Perdu', 6, 'perdu');

-- Aucun champ sur mesure d'avance : la fiche de départ porte déjà le nom,
-- l'email, le téléphone, l'entreprise, le montant et la source. Ce qu'on
-- ajoute par-dessus appartient à un métier, et l'outil n'en connaît aucun.
