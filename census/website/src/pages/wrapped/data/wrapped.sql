-- Curated selections for the website's season "wrapped" presentation (counts live in stats.json).
-- Ordering by md5(id) keeps the selection stable between runs without being chronological.
with season as (
  select id, start_date from seasons
  where now() between start_date and end_date
  order by start_date desc limit 1
),
obs as (
  select o.* from observations o, season s where o.observed_at >= s.start_date and not o.removed
),
-- Primary identifications only: accessory identifications (the plant a critter was on, etc.) are
-- excluded from every selection, but still count towards the totals in stats.sql.
confirmed as (
  select i.* from identifications i join obs o on o.id = i.observation_id
  where i.deleted_at is null and i.confirmed_by is not null and i.is_accessory is not true
),
-- One well-framed image per confirmed identification.
framed as (
  select distinct on (c.id) c.id as identification_id, im.url, im.width, im.height, im.bounding_box
  from confirmed c
  join sightings si on si.observation_id = c.observation_id
  join images im on im.sighting_id = si.id
  where im.bounding_box is not null
    and (im.bounding_box->>'width')::int between 120 and 1400
    and (im.bounding_box->>'height')::int between 120 and 1400
  order by c.id, (im.bounding_box->>'width')::int * (im.bounding_box->>'height')::int desc
),
captures as (
  select c.nickname, f.url, f.width, f.height, f.bounding_box
  from framed f join confirmed c on c.id = f.identification_id
  order by md5(f.identification_id::text) limit 36
),
comments as (
  select f.id, trim(regexp_replace(f.comment, '\s+', ' ', 'g')) as comment, u.username, i.nickname
  from feedback f
  join confirmed i on i.id = f.identification_id
  join users u on u.id = f.user_id and u.status = 'active'
  where f.deleted_at is null and f.comment_deleted_at is null and f.type = 'agree'
    and length(trim(f.comment)) between 70 and 200
    and f.comment !~* '(https?://|www\.|@)'
  order by md5(f.id::text) limit 30
),
suggestions as (
  select c.nickname, c.name, u.username, f.url, f.width, f.height, f.bounding_box
  from confirmed c
  join users u on u.id = c.suggested_by and u.status = 'active'
  join framed f on f.identification_id = c.id
  where c.nickname is not null
  order by md5(c.id::text) limit 24
),
species as (
  select min(nickname) as nickname, min(name) as name, count(distinct observation_id) as observations
  from confirmed group by source_id
  order by observations desc, nickname limit 8
),
shiny_holders as (
  select s.id as shiny_id, u.username, a.created_at
  from shinies s
  join season se on se.id = s.season_id
  join identifications i on i.source_id = s.inat_id::text
  join achievements a on a.identification_id = i.id and a.type = 'shiny' and a.redeemed and not a.revoked
  join users u on u.id = a.user_id and u.status = 'active'
),
found as (
  select s.id, i.nickname, i.name, s.artwork->>'url' as artwork,
    (select json_agg(username order by created_at) from (
       select distinct on (username) username, created_at from shiny_holders h where h.shiny_id = s.id
       order by username, created_at) d) as usernames
  from shinies s
  join season se on se.id = s.season_id
  join identifications i on i.id = s.identification_id
  where s.artwork->>'type' = 'url'
)
select json_build_object(
  'captures', (select json_agg(json_build_object('nickname', nickname, 'url', url, 'width', width, 'height', height, 'boundingBox', bounding_box)) from captures),
  'comments', (select json_agg(json_build_object('comment', comment, 'username', username, 'nickname', nickname)) from comments),
  'suggestions', (select json_agg(json_build_object('nickname', nickname, 'name', name, 'username', username, 'url', url, 'width', width, 'height', height, 'boundingBox', bounding_box)) from suggestions),
  'species', (select json_agg(json_build_object('nickname', nickname, 'name', name, 'observations', observations) order by observations desc) from species),
  'shinies', (select json_agg(json_build_object('id', id, 'nickname', nickname, 'name', name, 'artwork', artwork, 'usernames', coalesce(usernames, '[]'::json)) order by json_array_length(coalesce(usernames, '[]'::json))) from found)
);
