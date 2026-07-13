import { DownstreamError, NotFoundError } from '@alveusgg/error';
import { z } from 'zod';
import { withCoalescing } from '../../utils/cache.js';
import { useEnvironment } from '../../utils/env/env.js';

const TAXA_INFO_TTL_SECONDS = 60 * 60 * 24 * 7;

const TaxaSearchResult = z.object({
  id: z.number(),
  rank: z.string(),
  rank_level: z.number(),
  iconic_taxon_id: z.number().nullable(),
  ancestor_ids: z.array(z.number()),
  is_active: z.boolean(),
  name: z.string(),
  parent_id: z.number().nullable(),
  ancestry: z.string().nullable(),
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

const getTaxaInfoCacheKey = (iNatId: number) => `inat:taxa:${iNatId}`;

const parseCachedTaxaInfo = (value: string) => {
  try {
    const parsed = TaxaSearchResult.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
};

export const getTaxaFromPartialSearch = async (search: string, taxonId?: number) => {
  const params = new URLSearchParams({ q: search });
  if (taxonId) params.set('taxon_id', taxonId.toString());

  const response = await fetch(`https://api.inaturalist.org/v1/taxa/autocomplete?${params.toString()}`);
  const data = await response.json();
  return SearchResults.parse(data);
};

export const getTaxaInfo = withCoalescing(
  async (iNatId: number) => {
    const { cache } = useEnvironment();
    const cacheKey = getTaxaInfoCacheKey(iNatId);
    const cached = await cache.get(cacheKey);
    if (cached) {
      const taxon = parseCachedTaxaInfo(cached);
      if (taxon) return taxon;

      await cache.delete(cacheKey);
    }

    const response = await fetch(`https://api.inaturalist.org/v1/taxa/${iNatId}`);
    if (!response.ok) {
      throw new DownstreamError('inat', `Failed to fetch taxon ${iNatId}: ${response.status}`);
    }

    const data = await response.json();
    const { results } = SearchResults.parse(data);
    const taxon = results[0];
    if (!taxon) throw new NotFoundError('Taxon not found');

    await cache.set(cacheKey, JSON.stringify(taxon), TAXA_INFO_TTL_SECONDS);
    return taxon;
  },
  { key: getTaxaInfoCacheKey }
);
