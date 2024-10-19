import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast font-sans group-[.toaster]:bg-accent-50 border group-[.toaster]:text-accent-900 group-[.toaster]:border-accent-900 group-[.toaster]:border-opacity-10  group-[.toaster]:shadow-lg',
          title: 'group-[.toast]:font-semibold',
          description: 'group-[.toast]:text-accent-700 group-[.toast]:font-semibold',
          actionButton: 'group-[.toast]:bg-accent-50 group-[.toast]:text-accent-900',
          cancelButton: 'group-[.toast]:bg-accent-50 group-[.toast]:text-accent-900'
        }
      }}
      {...props}
    />
  );
};
export { Toaster };
