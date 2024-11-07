import { FC } from 'react';

import { levels } from '@alveusgg/census-levels';
export const Home: FC = () => {
  return <div>{JSON.stringify(levels)}</div>;
};
