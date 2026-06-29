import { Button } from '@/components/controls/button/juicy';
import { FieldError } from '@/components/forms/Error';
import { Field } from '@/components/forms/Field';
import { Form } from '@/components/forms/Form';
import { CheckboxField } from '@/components/forms/inputs/CheckboxInput';
import { NumberField } from '@/components/forms/inputs/NumberInput';
import { TextAreaField } from '@/components/forms/inputs/TextAreaInput';
import { TextField } from '@/components/forms/inputs/TextInput';
import { Label } from '@/components/forms/Label';
import { useConfetti } from '@/components/layout/ConfettiProvider';
import { useAchievements } from '@/components/layout/LayoutProvider';
import { usePointAction } from '@/components/points/hooks';
import { PointOrigin } from '@/components/points/PointOrigin';
import { Clipboard } from '@/layouts/Clipboard';
import { useOnboardUser } from '@/services/api/me';
import { OnboardingSubmissionSchema } from '@alveusgg/census-forms';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC } from 'react';
import { type SubmitErrorHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export const Onboarding: FC = () => {
  const navigate = useNavigate();
  const methods = useForm<OnboardingSubmissionSchema>({
    resolver: zodResolver(OnboardingSubmissionSchema)
  });
  const action = usePointAction();
  const confetti = useConfetti();
  const onboard = useOnboardUser();
  const [, setOpen] = useAchievements();

  const onError: SubmitErrorHandler<OnboardingSubmissionSchema> = errors => {
    if (errors.onboarding?.agreeToTerms) {
      toast.error('Please agree to the terms before continuing.');
    }
  };

  const onSubmit = async (data: OnboardingSubmissionSchema) => {
    setOpen(true);
    await action.add(200);
    await onboard.mutateAsync(data);
    confetti();
    navigate('/observations');
  };
  return (
    <Clipboard container={{ className: 'max-w-3xl' }} className="text-accent-900 min-h-screen md:px-12 md:py-20">
      <Form className="flex flex-col gap-4" methods={methods} onSubmit={onSubmit} onError={onError}>
        <h1 className="text-3xl font-semibold leading-8 text-center text-balance sm:text-left">
          welcome to the <span className="font-extrabold">alveus pollinator census!</span>
        </h1>
        <p className="leading-tight">
          Tell us a little about how you found Alveus and your experience with community science so far.
        </p>
        <Field name="onboarding.firstHeardAboutAlveus">
          <Label content="When did you first hear about Alveus?">
            <TextField />
            <FieldError />
          </Label>
        </Field>
        <Field name="onboarding.communityScienceExperience">
          <Label content="Have you taken part in an IRL or online community science project before?">
            <TextAreaField />
            <FieldError />
          </Label>
        </Field>
        <Field name="onboarding.bugIdentifyingSkills">
          <Label content="How would you describe your bug identifying skills?">
            <TextAreaField />
            <FieldError />
          </Label>
        </Field>
        <Field name="onboarding.alveusWatchFrequency">
          <Label content="How often do you watch alveus?">
            <TextField />
            <FieldError />
          </Label>
        </Field>
        <Field name="age">
          <Label content="How old are you?">
            <p className="text-sm leading-tight">
              This information won't be associated with your account in any way so please be honest. This gives Alveus a
              key insight into the demographics of who is taking part.
            </p>
            <NumberField />
            <FieldError />
          </Label>
        </Field>
        <div className="flex flex-col gap-1">
          <Field name="onboarding.agreeToTerms">
            <Label
              className="flex-row-reverse justify-between w-full"
              content={
                <>
                  I understand that this will be used for research purposes and I consent to it.{' '}
                  <a
                    href="https://www.alveussanctuary.org/privacy-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline underline-offset-2"
                  >
                    Read more about it here.
                  </a>
                </>
              }
            >
              <CheckboxField />
            </Label>
            <FieldError />
          </Field>
        </div>
        <PointOrigin className="self-end" {...action}>
          <Button type="submit" loading={action.isPending || onboard.isPending}>
            Submit & get started
          </Button>
        </PointOrigin>
      </Form>
    </Clipboard>
  );
};
