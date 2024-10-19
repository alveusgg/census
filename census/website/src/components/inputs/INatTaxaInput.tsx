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
    queryFn: () => api.observation.search.query({ search }),
    enabled: !!search
  });

  return (
    <div ref={ref} className="group w-full relative">
      <button type="button" className="w-full cursor-text" onClick={() => setOpen(true)}>
        <div className="px-3 flex gap-2 items-center w-full transition-colors duration-100 hover:bg-[#FAF4E2]">
          <svg className="max-w-4 min-w-4" viewBox="0 0 13 13" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.9427 6.68228L9.63259 3.18853H9.63208C9.35634 2.77212 8.88408 2.49689 8.34732 2.49689C7.49724 2.49689 6.80812 3.18599 6.80812 4.03661C6.80812 4.11532 6.81421 4.19301 6.82538 4.26868L6.82589 4.27122L6.83706 4.34486H6.1637L6.17487 4.27122L6.17538 4.26868C6.18706 4.19302 6.19265 4.11532 6.19265 4.03661C6.19265 3.18652 5.50354 2.49689 4.65345 2.49689C4.11669 2.49689 3.64392 2.77162 3.36868 3.18853H3.36818L1.05717 6.68228H1.05767C0.800208 7.07177 0.649902 7.53794 0.649902 8.03961C0.649902 9.40006 1.75287 10.5025 3.11275 10.5025C4.34674 10.5025 5.3689 9.59499 5.54817 8.41024L5.65735 7.68711C5.87266 7.90446 6.17024 8.03902 6.49982 8.03902C6.82887 8.03902 7.12696 7.90394 7.34177 7.68711L7.45095 8.41024C7.63021 9.59446 8.65193 10.5025 9.88637 10.5025C11.2468 10.5025 12.3497 9.39999 12.3497 8.03961C12.3497 7.53839 12.1994 7.07222 11.942 6.68267L11.9427 6.68228ZM3.11283 9.6403C2.23025 9.6403 1.51175 8.92225 1.51175 8.03922C1.51175 7.15663 2.2303 6.43814 3.11283 6.43814C3.99541 6.43814 4.71391 7.15618 4.71391 8.03922C4.71442 8.92231 3.99587 9.6403 3.11283 9.6403ZM6.49998 7.42367C6.18513 7.42367 5.92971 7.16824 5.92971 6.85339C5.92971 6.53855 6.18513 6.28312 6.49998 6.28312C6.81483 6.28312 7.07025 6.53855 7.07025 6.85339C7.07025 7.16824 6.81483 7.42367 6.49998 7.42367ZM9.88713 9.6403C9.00455 9.6403 8.28605 8.92225 8.28605 8.03922C8.28605 7.15663 9.00409 6.43814 9.88713 6.43814C10.7697 6.43814 11.4882 7.15618 11.4882 8.03922C11.4877 8.92231 10.7697 9.6403 9.88713 9.6403Z" />
          </svg>
          <p className="py-1.5 w-full text-sm text-left text-accent-800 opacity-75 outline-none">{placeholder}</p>
        </div>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            style={{ width: width ?? 'auto' }}
            className={cn(
              'z-50 bg-[#FAF4E2] text-accent-800 outline-none overflow-y-scroll',
              'absolute top-0 left-0 right-0 rounded-b-md'
            )}
          >
            <Command loop shouldFilter={false}>
              <div className="px-3 flex cursor-pointer gap-2 items-center w-full transition-colors duration-100 hover:bg-[#FAF4E2]">
                <svg
                  className="max-w-4 min-w-4"
                  viewBox="0 0 13 13"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M11.9427 6.68228L9.63259 3.18853H9.63208C9.35634 2.77212 8.88408 2.49689 8.34732 2.49689C7.49724 2.49689 6.80812 3.18599 6.80812 4.03661C6.80812 4.11532 6.81421 4.19301 6.82538 4.26868L6.82589 4.27122L6.83706 4.34486H6.1637L6.17487 4.27122L6.17538 4.26868C6.18706 4.19302 6.19265 4.11532 6.19265 4.03661C6.19265 3.18652 5.50354 2.49689 4.65345 2.49689C4.11669 2.49689 3.64392 2.77162 3.36868 3.18853H3.36818L1.05717 6.68228H1.05767C0.800208 7.07177 0.649902 7.53794 0.649902 8.03961C0.649902 9.40006 1.75287 10.5025 3.11275 10.5025C4.34674 10.5025 5.3689 9.59499 5.54817 8.41024L5.65735 7.68711C5.87266 7.90446 6.17024 8.03902 6.49982 8.03902C6.82887 8.03902 7.12696 7.90394 7.34177 7.68711L7.45095 8.41024C7.63021 9.59446 8.65193 10.5025 9.88637 10.5025C11.2468 10.5025 12.3497 9.39999 12.3497 8.03961C12.3497 7.53839 12.1994 7.07222 11.942 6.68267L11.9427 6.68228ZM3.11283 9.6403C2.23025 9.6403 1.51175 8.92225 1.51175 8.03922C1.51175 7.15663 2.2303 6.43814 3.11283 6.43814C3.99541 6.43814 4.71391 7.15618 4.71391 8.03922C4.71442 8.92231 3.99587 9.6403 3.11283 9.6403ZM6.49998 7.42367C6.18513 7.42367 5.92971 7.16824 5.92971 6.85339C5.92971 6.53855 6.18513 6.28312 6.49998 6.28312C6.81483 6.28312 7.07025 6.53855 7.07025 6.85339C7.07025 7.16824 6.81483 7.42367 6.49998 7.42367ZM9.88713 9.6403C9.00455 9.6403 8.28605 8.92225 8.28605 8.03922C8.28605 7.15663 9.00409 6.43814 9.88713 6.43814C10.7697 6.43814 11.4882 7.15618 11.4882 8.03922C11.4877 8.92231 10.7697 9.6403 9.88713 9.6403Z" />
                </svg>
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  autoFocus
                  className="py-1.5 w-full text-sm bg-transparent text-accent-800 placeholder:opacity-75 placeholder:text-accent-900 outline-none"
                  placeholder={placeholder}
                />
              </div>
              <Command.List className="h-40 overflow-y-scroll border-t border-[#F4ECD9] flex flex-col">
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
                      className="px-3 py-1 cursor-pointer data-[disabled=true]:pointer-events-none data-[selected=true]:bg-[#F4ECD9] data-[disabled=true]:opacity-50"
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
