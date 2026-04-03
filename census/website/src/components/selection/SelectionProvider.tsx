import { createContext, FC, PropsWithChildren, useContext, useState } from 'react';

interface SelectionContextValue {
  selection: string[];
  clearSelection: () => void;
  toggleSelection: (id: string) => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export const SelectionProvider: FC<PropsWithChildren> = ({ children }) => {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const value: SelectionContextValue = {
    selection: Array.from(selected),
    clearSelection: () => setSelected(new Set()),
    toggleSelection: id => {
      setSelected(previous => {
        const next = new Set(previous);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }
  };

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) throw new Error('useSelection must be used inside SelectionProvider');
  return context;
};
