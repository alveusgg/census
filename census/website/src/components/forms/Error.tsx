import { FC } from 'react';
import { useFormContext } from 'react-hook-form';
import { useField } from './Field';

export const FieldError: FC = () => {
  const { name } = useField();
  const {
    formState: { errors }
  } = useFormContext();
  const error = errors[name];
  if (!error) return null;
  return (
    <div className="bg-[#FFCFCD] text-[#811D1D] py-1.5 px-4 text-sm font-medium text-center rounded-lg w-full border border-[#E08A85]">
      {error.message?.toString()}
    </div>
  );
};

export const FormError: FC = () => {
  const {
    formState: { errors }
  } = useFormContext();
  if (Object.keys(errors).length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium">There are some issues:</p>
      <ul className="bg-[#FFCFCD] text-[#811D1D] py-1.5 px-4 text-sm font-medium rounded-lg w-full border border-[#E08A85]">
        {Object.entries(errors).map(([key, error]) => {
          const message = error?.message?.toString();
          if (!message) return null;
          return (
            <li key={key}>
              {key}: {message}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
