import { z } from 'zod';

export const OnboardingFormSchema = z.object({
  bugLikingComment: z
    .string({ required_error: 'Please enter a comment' })
    .min(2, { message: 'Please enter a comment with at least 2 characters' }),
  agreeToTerms: z.literal(true, { required_error: 'Please agree to the terms' })
});

export type OnboardingFormSchema = z.infer<typeof OnboardingFormSchema>;
