import { cn } from '@/utils/cn';
import { FC, PropsWithChildren } from 'react';
import { useSelection } from './SelectionProvider';

interface SelectionContainerProps {
  id: string | number;
  className?: string;
}

export const SelectionContainer: FC<PropsWithChildren<SelectionContainerProps>> = ({ id, className, children }) => {
  const key = String(id);
  const { selection, toggleSelection } = useSelection();
  const selected = selection.includes(key);

  return (
    <div
      data-selected={selected}
      className={cn('relative rounded-lg ring-accent-500/60 data-[selected=true]:ring-2', className)}
      onClick={() => toggleSelection(key)}
    >
      <button
        type="button"
        aria-label={selected ? 'unselect item' : 'select item'}
        aria-pressed={selected}
        className={cn(
          'absolute left-2.5 top-2.5 z-30 flex h-[1.8rem] w-[1.8rem] items-center justify-center rounded-full border-2 shadow-lg bg-white'
        )}
        onClick={event => {
          event.stopPropagation();
          toggleSelection(key);
        }}
      >
        <div
          className={cn(
            'h-[1rem] w-[1rem] rounded-full bg-accent-700 transition-colors',
            selected ? 'bg-accent-700' : 'bg-white'
          )}
        />
      </button>
      {children}
    </div>
  );
};
