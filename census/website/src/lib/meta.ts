import { FC, useEffect, useState } from 'react';

interface Meta {
  title: string;
}

export const Meta: FC<Meta> = ({ title }) => {
  const [original] = useState<string>(document.title);
  useEffect(() => {
    document.title = title;

    return () => {
      document.title = original;
    };
  }, [title, original]);

  return null;
};
