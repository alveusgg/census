import { z } from 'zod';

const TaxaSearchResult = z.object({
  id: z.number(),
  rank: z.string(),
  rank_level: z.number(),
  iconic_taxon_id: z.number(),
  ancestor_ids: z.array(z.number()),
  is_active: z.boolean(),
  name: z.string(),
  parent_id: z.number(),
  ancestry: z.string(),
  extinct: z.boolean(),
  taxon_changes_count: z.number(),
  taxon_schemes_count: z.number(),
  observations_count: z.number(),
  current_synonymous_taxon_ids: z.array(z.number()).nullish(),
  atlas_id: z.number().nullish(),
  complete_species_count: z.number().nullish(),
  wikipedia_url: z.string().nullish(),
  matched_term: z.string().nullish(),
  iconic_taxon_name: z.string().nullish(),
  preferred_common_name: z.string().nullish()
});

const SearchResults = z.object({
  page: z.number(),
  per_page: z.number(),
  total_results: z.number(),
  results: z.array(TaxaSearchResult)
});

export type TaxaSearchResult = z.infer<typeof TaxaSearchResult>;

export const getTaxaFromPartialSearch = async (search: string) => {
  const response = await fetch(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(search)}`);
  const data = await response.json();
  return SearchResults.parse(data);
};
