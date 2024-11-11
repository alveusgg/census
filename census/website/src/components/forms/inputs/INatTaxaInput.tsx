import SiBinoculars from '@/components/icons/SiBinoculars';
import { useAPI } from '@/services/query/hooks';
import { cn } from '@/utils/cn';
import { useQuery } from '@tanstack/react-query';
import { useDebounce, useMeasure } from '@uidotdev/usehooks';
import { Command } from 'cmdk';
import { FC, useState } from 'react';

export interface InputProps<T> {
  onSelect: (value: T) => void;
  placeholder?: string;
}

interface TaxaSearchResult {
  id: number;
  name: string;
  family?: string;
  scientific: string;
}

export const INatTaxaInput: FC<InputProps<TaxaSearchResult>> = ({ onSelect, placeholder }) => {
  const [query, setQuery] = useState('');
  const search = useDebounce(query, 300);

  const [ref, { width }] = useMeasure();
  const [open, setOpen] = useState(false);

  const api = useAPI();

  const results = useQuery({
    queryKey: ['inat-taxa', search],
    queryFn: () => api.identification.searchForTaxa.query({ query: search }),
    enabled: !!search
  });

  return (
    <div ref={ref} className="group w-full relative">
      <button type="button" className="w-full cursor-text" onClick={() => setOpen(true)}>
        <div className="px-3 flex gap-2 items-center w-full transition-colors duration-100 hover:bg-accent-100">
          <SiBinoculars className="text-2xl pt-0.5" />
          <p className="py-1.5 w-full text-sm text-left text-accent-800 opacity-75 outline-none font-medium">
            {placeholder}
          </p>
        </div>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            style={{ width: width ?? 'auto' }}
            className={cn(
              'z-50 bg-accent-50 text-accent-800 outline-none overflow-y-scroll',
              'absolute top-0 left-0 right-0 rounded-b-md'
            )}
          >
            <Command loop shouldFilter={false}>
              <div className="px-3 flex cursor-pointer gap-2 items-center w-full transition-colors duration-100 hover:bg-accent-100">
                <SiBinoculars className="text-2xl pt-0.5" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  autoFocus
                  className="py-1.5 w-full text-sm bg-transparent text-accent-800 placeholder:opacity-75 placeholder:text-accent-900 font-medium outline-none"
                  placeholder={placeholder}
                />
              </div>
              <Command.List className="h-40 overflow-y-scroll border border-accent border-opacity-50 flex flex-col rounded-b-md">
                {(search.length === 0 ||
                  results.isLoading ||
                  (results.isSuccess && results.data.results.length === 0)) && (
                  <div className="flex items-center justify-center h-40 w-full">
                    {search.length === 0 && <Command.Empty>Start typing to search</Command.Empty>}
                    {results.isLoading && <Command.Loading>Loading...</Command.Loading>}
                    {results.isSuccess && query.length > 0 && results.data.results.length === 0 && (
                      <Command.Empty>No results found.</Command.Empty>
                    )}
                  </div>
                )}
                <Command.Group>
                  {results.data?.results.map(result => (
                    <Command.Item
                      className="px-3 py-1 cursor-pointer data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent-100 data-[disabled=true]:opacity-50"
                      key={result.id}
                      value={result.name}
                      onSelect={() => {
                        onSelect({
                          id: result.id,
                          name: result.preferred_common_name ?? result.name,
                          scientific: result.name,
                          family: result.iconic_taxon_name ?? undefined
                        });
                        setOpen(false);
                        setQuery('');
                      }}
                    >
                      <p className="text-sm">{result.preferred_common_name}</p>
                      <p className="text-xs opacity-75">{result.name}</p>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </div>
        </>
      )}
    </div>
  );
};
