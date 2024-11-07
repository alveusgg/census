export const variants = {
  primary: 'bg-accent-400 hover:bg-accent-500 text-accent-950',
  custom: 'bg-custom hover:bg-custom-darker text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  alveus: 'bg-alveus hover:bg-alveus-darker text-white'
};

export interface ButtonProps {
  loading?: boolean;
  variant?: keyof typeof variants | false;

  disabled?: string | boolean;

  shortcut?: string;
  onShortcut?: () => void;
}
