-- Season overview stats for the season that is currently running.
with season as (
  select id, start_date, end_date from seasons
  where now() between start_date and end_date
  order by start_date desc limit 1
),
ach as (
  select a.* from achievements a, season s
  where a.created_at >= s.start_date and a.redeemed and not a.revoked
),
fb as (
  select f.* from feedback f, season s
  where f.created_at >= s.start_date and f.deleted_at is null
),
cap as (
  select c.* from captures c, season s where c.captured_at >= s.start_date
),
obs as (
  select o.* from observations o, season s where o.observed_at >= s.start_date and not o.removed
),
idn as (
  select i.* from identifications i join obs o on o.id = i.observation_id where i.deleted_at is null
),
onboarded as (
  select r.* from responses r, season s where r.type = 'onboarding' and r.created_at >= s.start_date
),
contributors as (
  select user_id from fb union select captured_by from cap union select suggested_by from idn
),
daily as (
  select d::date as day,
    (select count(*) from fb where fb.created_at::date = d::date) as feedback,
    (select count(*) from onboarded where onboarded.created_at::date = d::date) as signups
  from season s, generate_series(s.start_date::date, least(now(), s.end_date)::date, '1 day') d
),
top as (
  select u.username, sum(ach.points) as points
  from ach join users u on u.id = ach.user_id
  where u.status = 'active'
  group by u.id, u.username order by points desc, u.id asc limit 3
)
select json_build_object(
  'season', (select json_build_object('id', id, 'start', start_date, 'end', end_date) from season),
  'generated_at', now(),
  'points', (select coalesce(sum(points), 0) from ach),
  'achievements', (select count(*) from ach),
  'votes', (select count(*) from fb where type in ('agree', 'disagree')),
  'agrees', (select count(*) from fb where type = 'agree'),
  'disagrees', (select count(*) from fb where type = 'disagree'),
  'comments', (select count(*) from fb where comment is not null and comment_deleted_at is null and trim(comment) <> ''),
  'clips_submitted', (select count(*) from cap),
  'captures_made', (select count(*) from cap where status = 'complete'),
  'observations', (select count(*) from obs),
  'sightings', (select count(*) from sightings si join obs o on o.id = si.observation_id),
  'identifications', (select count(*) from idn),
  'identifications_confirmed', (select count(*) from idn where confirmed_by is not null),
  'species_confirmed', (select count(distinct source_id) from idn where confirmed_by is not null),
  'shinies_found', (select count(*) from ach where type = 'shiny'),
  'onboarded', (select count(*) from onboarded),
  'onboarded_distinct', (select count(distinct user_id) from onboarded),
  'contributors', (select count(*) from contributors),
  'median_age', (select percentile_cont(0.5) within group (order by (payload->>'age')::int)
                 from anonymous_responses a, season s
                 where a.created_at >= s.start_date and a.payload->>'age' ~ '^\d{1,2}$'),
  'busiest_day', (select json_build_object('day', day, 'feedback', feedback) from daily order by feedback desc limit 1),
  'daily', (select json_agg(json_build_object('day', day, 'feedback', feedback, 'signups', signups) order by day) from daily),
  'top', (select json_agg(json_build_object('username', username, 'points', points) order by points desc) from top)
);
