import { Button } from '@/components/controls/button/juicy';
import { Field } from '@/components/forms/Field';
import { Form } from '@/components/forms/Form';
import { TextAreaField } from '@/components/forms/inputs/TextAreaInput';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { useConfirmIdentification } from '@/services/api/identifications';
import { Identification } from '@/services/api/observations';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ConfirmationAnnotation,
  ConfirmationAnnotationEditor,
  ConfirmationImage
} from './ConfirmationAnnotationEditor';

export interface ConfirmIdentificationModalProps {
  identification: Identification;
  observationImages: ConfirmationImage[];
}

const ConfirmIdentificationFields = z.object({
  comment: z.string().optional()
});

type ConfirmIdentificationFields = z.infer<typeof ConfirmIdentificationFields>;

const ConfirmIdentificationForm: FC<ModalProps<ConfirmIdentificationModalProps>> = props => {
  const identification = props.props?.identification;
  if (!identification) throw new Error('identification is required');

  const observationImages = props.props?.observationImages ?? [];
  const [annotations, setAnnotations] = useState<ConfirmationAnnotation[]>([]);
  const [confirmationError, setConfirmationError] = useState<string>();
  const [annotationTextByKey, setAnnotationTextByKey] = useState<Record<string, string>>({});

  const methods = useForm<ConfirmIdentificationFields>({
    resolver: zodResolver(ConfirmIdentificationFields)
  });
  const comment = methods.watch('comment');

  const confirmIdentification = useConfirmIdentification();

  useEffect(() => {
    setAnnotationTextByKey(current => {
      const annotationKeys = new Set(annotations.map(annotation => annotation.key));
      const next = Object.fromEntries(Object.entries(current).filter(([key]) => annotationKeys.has(key)));
      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
  }, [annotations]);

  useEffect(() => {
    if (!comment?.trim()) return;
    setConfirmationError(undefined);
  }, [comment]);

  const handleAnnotationTextChange = useCallback((key: string, value: string) => {
    setConfirmationError(undefined);
    setAnnotationTextByKey(current => ({ ...current, [key]: value }));
  }, []);

  const submitFeedback = async (data: ConfirmIdentificationFields) => {
    const comment = data.comment?.trim() ?? '';
    const hasConfirmationDetails = annotations.length > 0 || comment.length > 0;
    if (!hasConfirmationDetails) {
      setConfirmationError('Add at least one annotation or an additional comment before confirming.');
      return;
    }

    const missingAnnotationText = annotations.some(annotation => !annotationTextByKey[annotation.key]?.trim());
    if (missingAnnotationText) {
      setConfirmationError('Add a note for each annotation before confirming.');
      return;
    }

    const confirmationAnnotations = annotations.map(annotation => ({
      box: annotation.box,
      canvas: annotation.canvas,
      comment: annotationTextByKey[annotation.key]?.trim() || undefined,
      imageId: annotation.imageId,
      imageIndex: annotation.imageIndex,
      shape: annotation.shape
    }));

    await confirmIdentification.mutateAsync({ id: identification.id, comment, annotations: confirmationAnnotations });
    props.close();
  };

  const globalCommentsField = (
    <div className="flex flex-col gap-3">
      <label
        htmlFor="confirmation-additional-comments"
        className="border-b border-accent-300 pb-3 text-lg font-semibold text-accent-800"
      >
        Additional comments
      </label>
      <Field name="comment">
        <TextAreaField
          id="confirmation-additional-comments"
          className="border border-accent-300 bg-accent-50 bg-opacity-100 text-sm font-semibold leading-5 ring-0 focus-within:border-accent-700 focus-within:ring-0"
          placeholder="Add additional comments"
        />
      </Field>
    </div>
  );

  return (
    <Form className="flex min-h-0 flex-col gap-4" methods={methods} onSubmit={submitFeedback}>
      <div className="flex flex-col">
        <h1 className="flex items-center justify-between gap-1 text-2xl font-bold md:text-3xl">
          <span>Confirm identification for {identification.name}</span>
        </h1>
      </div>
      {observationImages.length > 0 ? (
        <ConfirmationAnnotationEditor
          images={observationImages}
          annotationError={confirmationError}
          annotationTextByKey={annotationTextByKey}
          globalCommentsField={globalCommentsField}
          onAnnotationTextChange={handleAnnotationTextChange}
          onAnnotationsChange={setAnnotations}
        />
      ) : (
        <>
          {globalCommentsField}
          {confirmationError && <p className="text-sm font-bold text-red-700">{confirmationError}</p>}
        </>
      )}
      <Button loading={confirmIdentification.isPending} type="submit" className="self-end">
        Confirm
      </Button>
    </Form>
  );
};

export const ConfirmIdentificationModal: FC<ModalProps<ConfirmIdentificationModalProps>> = props => {
  return (
    <Modal
      title={`Confirm identification for ${props.props?.identification.name ?? 'suggestion'}`}
      className="w-[calc(100vw-2rem)] max-w-5xl rounded-lg bg-accent-100 px-6 py-6 text-accent-900 ring-4 ring-inset ring-accent-300 md:px-8"
      {...props}
    >
      <ConfirmIdentificationForm {...props} />
    </Modal>
  );
};
