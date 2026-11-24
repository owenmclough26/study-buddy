-- Study Buddy: every buddy is a cat now. The `species` column holds the cat's coat.
-- Run once: Dashboard -> SQL Editor -> New query -> paste -> Run.

alter table public.buddies drop constraint if exists buddies_species_check;

-- turn older buddies into cats
update public.buddies
set species = case species
  when 'blob' then 'gray'
  when 'cat' then 'ginger'
  when 'dragon' then 'black'
  else species
end;

alter table public.buddies
  add constraint buddies_species_check
  check (species in ('ginger', 'gray', 'black', 'calico', 'tuxedo', 'cream'));
