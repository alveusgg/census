export interface ButtonProps {
  loading?: boolean;
  variant?: 'alveus' | 'primary' | 'custom' | 'danger' | false;

  disabled?: string | boolean;

  shortcut?: string;
  onShortcut?: () => void;
}
