import { Button } from '@/components/controls/button/juicy';
import { FieldError } from '@/components/forms/Error';
import { Field } from '@/components/forms/Field';
import { Form } from '@/components/forms/Form';
import { CheckboxField } from '@/components/forms/inputs/CheckboxInput';
import { TextAreaField } from '@/components/forms/inputs/TextAreaInput';
import { Label } from '@/components/forms/Label';
import { useConfetti } from '@/components/layout/ConfettiProvider';
import { useAchievements } from '@/components/layout/LayoutProvider';
import { usePointAction } from '@/components/points/hooks';
import { PointOrigin } from '@/components/points/PointOrigin';
import { Clipboard } from '@/layouts/Clipboard';
import { useOnboardUser } from '@/services/api/me';
import { lorum } from '@/utils/placeholder';
import { OnboardingFormSchema } from '@alveusgg/census-forms';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

export const Onboarding: FC = () => {
  const navigate = useNavigate();
  const methods = useForm<OnboardingFormSchema>({
    resolver: zodResolver(OnboardingFormSchema)
  });
  const action = usePointAction();
  const confetti = useConfetti();
  const onboard = useOnboardUser();
  const [, setOpen] = useAchievements();

  const onSubmit = async (data: OnboardingFormSchema) => {
    setOpen(true);
    await action.add(200);
    await onboard.mutateAsync(data);
    confetti();
    navigate('/observations');
  };
  return (
    <Clipboard container={{ className: 'max-w-3xl' }} className="text-accent-900 min-h-screen md:px-12 md:py-20">
      <Form className="flex flex-col gap-4" methods={methods} onSubmit={onSubmit}>
        <h1 className="text-3xl font-semibold leading-8 text-center text-balance sm:text-left">
          welcome to the <span className="font-extrabold">alveus pollinator census!</span>
        </h1>
        <p className="leading-tight">{lorum(4)}</p>
        <Field name="bugLikingComment">
          <Label content="How much do you like bugs?">
            <TextAreaField />
            <FieldError />
          </Label>
        </Field>
        <div className="flex flex-col gap-1">
          <Field name="agreeToTerms">
            <Label
              className="flex-row-reverse justify-between w-full"
              content="I understand that this will be used for research purposes and I consent to it. Read more about it here."
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
