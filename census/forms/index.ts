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
