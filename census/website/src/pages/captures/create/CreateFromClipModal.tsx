import { AutoAnimatedContainer } from '@/components/animation/AnimateHeight';
import { Button } from '@/components/controls/button/paper';
import { Form } from '@/components/forms/Form';
import SiEnterKey from '@/components/icons/SiEnterKey';
import SiTwitch from '@/components/icons/SiTwitch';
import { Loader } from '@/components/loaders/Loader';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { useCapture, useCreateCaptureFromClip } from '@/services/api/capture';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC, Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';

const CreateFromClipFormFields = z.object({
  url: z.string().url()
});

type CreateFromClipFormFields = z.infer<typeof CreateFromClipFormFields>;

export const CreateFromClipModal: FC<ModalProps> = props => {
  const methods = useForm<CreateFromClipFormFields>({
    resolver: zodResolver(CreateFromClipFormFields)
  });

  const createClip = useCreateCaptureFromClip();
  const onSubmit = async (data: CreateFromClipFormFields) => {
    const url = new URL(data.url);
    const id = url.pathname.split('/').pop();
    if (!id) throw new Error('Invalid clip URL');
    await createClip.mutateAsync({ id });
  };

  const navigate = useNavigate();

  return (
    <Modal className="bg-alveus-darker text-white px-5 py-4 w-full max-w-4xl" {...props}>
      <AutoAnimatedContainer>
        <div className="flex flex-col gap-4 py-1">
          <Form
            className="flex gap-4 items-center"
            methods={methods}
            onSubmit={onSubmit}
            onError={error => alert(`Error: ${error.message}`)}
          >
            <SiTwitch className="text-3xl" />
            <input
              autoFocus
              type="text"
              placeholder="Paste a twitch clip link"
              className="bg-alveus w-full px-3 py-2 rounded-md outline-none text-sm focus:ring-2 ring-white/30 placeholder:text-white/75"
              {...methods.register('url')}
            />
            <Button
              type="submit"
              loading={createClip.isPending}
              className="p-1 rounded-md hover:bg-white/20 transition-colors"
            >
              <SiEnterKey className="text-2xl" />
            </Button>
          </Form>
          {createClip.data && createClip.data.result === 'success' && (
            <div className="flex flex-col gap-4">
              <iframe
                className="w-full aspect-video rounded-md"
                src={`https://clips.twitch.tv/embed?clip=${createClip.data.capture.clipId}&parent=${window.location.hostname}`}
              />

              <Suspense>
                <ClipCreationProgress
                  id={createClip.data.capture.id}
                  onComplete={() => {
                    if (createClip.data.result !== 'success') {
                      return;
                    }
                    createClip.reset();
                    methods.reset();
                    props.close();
                    navigate(`/captures/${createClip.data.capture.id}`);
                  }}
                />
              </Suspense>
            </div>
          )}

          {createClip.data && createClip.data.result === 'error' && (
            <div className="flex justify-center items-center bg-[#6C2A2A] p-4 rounded-md">
              <p>{messages[createClip.data.type]}</p>
            </div>
          )}
        </div>
      </AutoAnimatedContainer>
    </Modal>
  );
};

const messages: Record<
  | 'clip_already_used'
  | 'clip_overlaps_with_other_capture'
  | 'clip_included_in_other_capture'
  | 'clip_contains_other_capture'
  | 'clip_not_found'
  | 'clip_not_processed'
  | 'vod_not_found',
  string
> = {
  clip_already_used: 'This clip has already been used to create a capture.',
  clip_overlaps_with_other_capture: 'This clip overlaps with another capture. Are you sure you want to continue?',
  clip_included_in_other_capture: 'This clip is included in another capture. Are you sure you want to continue?',
  clip_contains_other_capture: 'This clip contains another capture. Are you sure you want to continue?',
  clip_not_found: 'This clip was not found. Are you sure you pasted the correct link?',
  clip_not_processed: 'Sorry, Twitch is still processing this clip. Give it a minute and try again.',
  vod_not_found: 'This VOD was not found or is no longer available.'
};

interface ClipCreationProgressProps {
  id: number;
  onComplete: () => void;
}

export const ClipCreationProgress: FC<ClipCreationProgressProps> = ({ id, onComplete }) => {
  // This is a live updating query, so this will re-render as the capture is updated
  const capture = useCapture(id);

  useEffect(() => {
    if (capture.data.status === 'complete') {
      onComplete();
    }
  }, [capture]);

  return (
    <div className="flex justify-between items-center gap-3 bg-alveus p-4 rounded-md w-full">
      <p>We're upgrading this clip to 4K, please wait!</p>
      <Loader />
    </div>
  );
};
