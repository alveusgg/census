import { z } from 'zod';

export const OnboardingFormSchema = z.object({
  firstHeardAboutAlveus: z
    .string({ required_error: 'Please answer this question' })
    .min(2, { message: 'Please enter at least 2 characters' }),
  communityScienceExperience: z
    .string({ required_error: 'Please answer this question' })
    .min(2, { message: 'Please enter at least 2 characters' }),
  bugIdentifyingSkills: z
    .string({ required_error: 'Please answer this question' })
    .min(2, { message: 'Please enter at least 2 characters' }),
  alveusWatchFrequency: z
    .string({ required_error: 'Please answer this question' })
    .min(2, { message: 'Please enter at least 2 characters' }),
  agreeToTerms: z.literal(true, { required_error: 'Please agree to the terms' })
});

export type OnboardingFormSchema = z.infer<typeof OnboardingFormSchema>;

export const OnboardingSubmissionSchema = z.object({
  onboarding: OnboardingFormSchema,
  age: z.number()
});

export type OnboardingSubmissionSchema = z.infer<typeof OnboardingSubmissionSchema>;

// UTC ranges are an unadvertised alternative to pasting a Twitch clip URL.
export const CaptureTimestampRangeSchema = z
  .object({
    start: z.string().datetime({ precision: 3 }),
    end: z.string().datetime({ precision: 3 })
  })
  .refine(
    ({ start, end }) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return (
        Number.isFinite(startDate.getTime()) &&
        Number.isFinite(endDate.getTime()) &&
        startDate.toISOString() === start &&
        endDate.toISOString() === end &&
        startDate < endDate
      );
    },
    { message: 'Please enter a valid UTC timestamp range' }
  );

export const decodeCaptureTimestamp = (value: string): z.infer<typeof CaptureTimestampRangeSchema> | null => {
  try {
    const encoded = value.trim();
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
    const decoded = atob(encoded);
    const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z):(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)$/.exec(
      decoded
    );
    if (!match) return null;
    const result = CaptureTimestampRangeSchema.safeParse({ start: match[1], end: match[2] });
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};
