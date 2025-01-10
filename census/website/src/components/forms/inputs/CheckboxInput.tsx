import { FC } from 'react';
import { InputProps, withField } from '../Field';

interface CheckboxInputProps {}

export const CheckboxInput: FC<InputProps<boolean> & CheckboxInputProps> = ({ value, onChange, ...props }) => {
  return <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} {...props} />;
};

export const CheckboxField = withField<boolean, CheckboxInputProps>(CheckboxInput);
