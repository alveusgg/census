import { cn } from '@/utils/cn';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ComponentPropsWithoutRef, FC } from 'react';
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from './Dialog';

import { ModalProps } from './useModal';

type ModalComponentProps = ModalProps<any> & ComponentPropsWithoutRef<typeof DialogContent> & { title: string };

export const Modal: FC<ModalComponentProps> = ({
  children,
  className,
  close,
  isOpen,
  title,
  open: _open,
  toggle: _toggle,
  props: _modalProps,
  ...contentProps
}) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={state => {
        if (!state) close();
      }}
    >
      <DialogPortal container={document.getElementById('modal')}>
        <DialogOverlay className="z-[2001]" />
        {isOpen && (
          <DialogPrimitive.Content
            className={cn(
              'fixed left-[50%] top-[50%] z-[2002] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
              className
            )}
            {...contentProps}
          >
            <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
            {children}
          </DialogPrimitive.Content>
        )}
      </DialogPortal>
    </Dialog>
  );
};
