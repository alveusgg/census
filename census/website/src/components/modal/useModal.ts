import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';

export interface ModalProps<T = void> {
  isOpen: boolean;
  open: (props?: T) => void;
  close: () => void;
  toggle: (props?: T) => void;
  props?: T;
}

export function useModal<T = void>(initial: boolean = false): ModalProps<T> {
  const [props, setProps] = useState<T>();
  const [isOpen, setIsOpen] = useState(!!props || initial);

  const open = useCallback((props?: T) => {
    if (props) setProps(props);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    flushSync(() => {
      setIsOpen(false);
      setProps(undefined as unknown as T);
    });
  }, []);

  const toggle = useCallback(
    (props?: T) => {
      if (isOpen) close();
      else open(props);
    },
    [close, isOpen, open]
  );

  return { isOpen, open, close, toggle, props };
}
