import { Button } from '@/components/controls/button/juicy';
import { Button as PaperButton } from '@/components/controls/button/paper';
import { Form, useFormState } from '@/components/forms/Form';
import SiPin from '@/components/icons/SiPin';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { useLocateObservation } from '@/services/api/observations';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PanoLocationInput } from './PanoLocationInput';

export interface PanoLocationModalProps {
  observationId: number;
  location?: { x: number; y: number };
}

const PanoLocationFields = z.object({
  location: z
    .object({
      x: z.number(),
      y: z.number()
    })
    .nullable()
});

type PanoLocationFields = z.infer<typeof PanoLocationFields>;

const PanoLocationForm: FC<ModalProps<PanoLocationModalProps>> = props => {
  const observationId = props.props?.observationId;
  if (!observationId) throw new Error('observationId is required');

  const locateObservation = useLocateObservation();

  const methods = useForm<PanoLocationFields>({
    resolver: zodResolver(PanoLocationFields),
    defaultValues: { location: props.props?.location ?? null }
  });

  const [location, setLocation] = useFormState(methods, 'location');

  const handleSave = async (data: PanoLocationFields) => {
    if (!data.location) return;
    await locateObservation.mutateAsync({
      id: observationId,
      location: data.location
    });

    props.close();
  };

  return (
    <Form className="flex flex-col gap-4" methods={methods} onSubmit={handleSave}>
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">find the spot!</h1>
        <p className="leading-tight">Move around the garden and tap the spot where you think the clip was taken.</p>
      </div>

      <div className="w-full aspect-[3/1]">
        <Suspense
          fallback={<div className="w-full h-full rounded-lg border border-[#E9DFD5] bg-white animate-pulse" />}
        >
          <PanoLocationInput value={location} onChange={setLocation} />
        </Suspense>
      </div>

      <div className="flex justify-end gap-2">
        <PaperButton onClick={props.close} disabled={methods.formState.isSubmitting}>
          cancel
        </PaperButton>
        <Button type="submit" disabled={!location} loading={methods.formState.isSubmitting}>
          <SiPin className="text-xl" />
          save location
        </Button>
      </div>
    </Form>
  );
};

export const PanoLocationModal: FC<ModalProps<PanoLocationModalProps>> = props => {
  return (
    <Modal
      className="bg-accent-100 text-accent-900 ring-4 ring-accent-300 ring-inset rounded-lg px-8 py-6 w-full max-w-3xl"
      {...props}
    >
      {props.isOpen && props.props && <PanoLocationForm {...props} />}
    </Modal>
  );
};
