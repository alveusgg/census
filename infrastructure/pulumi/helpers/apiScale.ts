export type ApiScaleBehaviour = 'scale_to_zero' | 'standard';

export const getApiScaleBehaviour = (value?: string): ApiScaleBehaviour => {
  if (!value) return 'standard';
  if (value === 'scale_to_zero' || value === 'standard') return value;

  throw new Error(`Unknown API scale behaviour: ${value}`);
};

export const getApiScale = (behaviour: ApiScaleBehaviour) => {
  if (behaviour === 'scale_to_zero') {
    return {
      min: 0,
      max: 1,
      noOfRequestsPerInstance: 100
    };
  }

  return {
    min: 1,
    max: 1,
    noOfRequestsPerInstance: 100
  };
};
