import { useState } from 'react';

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

  const open = (props?: T) => {
    if (props) setProps(props);
    setIsOpen(true);
  };

  const close = () => {
    setProps(undefined as unknown as T);
    setIsOpen(false);
  };

  const toggle = (props?: T) => {
    if (isOpen) close();
    else open(props);
  };

  return { isOpen, open, close, toggle, props };
}
