export const variants = {
  light: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800',
  ghost: 'hover:bg-accent-900 hover:bg-opacity-5 text-accent-800',
  dark: 'bg-neutral-800 hover:bg-neutral-700 text-white',
  primary: 'bg-accent-300 hover:bg-accent-400 text-accent-950',
  secondary: 'bg-purple-500 hover:bg-purple-600 text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white'
};

export interface ButtonProps {
  loading?: boolean;
  variant?: keyof typeof variants | false;

  disabled?: string | boolean;

  shortcut?: string;
  onShortcut?: () => void;
}
