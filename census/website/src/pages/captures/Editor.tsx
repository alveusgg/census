import { Save } from '@/components/assets/icons/Save';
import { Button } from '@/components/button/juicy';
import { Note } from '@/components/containers/Note';
import { Form } from '@/components/forms/Form';
import { Timestamp } from '@/components/text/Timestamp';
import { useCapture } from '@/services/api/capture';
import { cn } from '@/utils/cn';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Controls from '@react-av/controls';
import * as Media from '@react-av/core';
import { format } from 'date-fns';
import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion';
import { FC, HTMLAttributes } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { CaptureProps } from './Capture';

const SaveAsCaptureFormFields = z.object({
  name: z.string().optional(),
  keep: z.array(z.string()).min(1),
  discard: z.array(z.string()),

  boundingBoxes: z.record(
    z.array(
      z.object({
        id: z.string(),
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number()
      })
    )
  ),

  taxa: z.array(
    z.object({
      id: z.number(),
      scientific: z.string(),
      family: z.string().optional(),
      name: z.string()
    })
  )
});

type SaveAsCaptureFormFields = z.infer<typeof SaveAsCaptureFormFields>;

export const Editor: FC<CaptureProps> = ({ id }) => {
  const capture = useCapture(id);
  // const createCapture = useCreateCaptureFromSnapshot();

  const methods = useForm<SaveAsCaptureFormFields>({
    resolver: zodResolver(SaveAsCaptureFormFields),
    defaultValues: {
      keep: [],
      discard: [],
      taxa: [],
      boundingBoxes: {}
    }
  });

  const onSubmit = async (data: SaveAsCaptureFormFields) => {
    console.log(data);
    // const capture = await createCapture.mutateAsync({
    //   snapshotId: id,
    //   images: data.keep.map(url => {
    //     const id = url.replace(/\./g, '_');
    //     const boundingBoxes = data.boundingBoxes[id] ?? [];
    //     return {
    //       url,
    //       boundingBoxes
    //     };
    //   }),
    //   name: data.name
    // });
    // console.log(capture);
    // navigate(`/captures/${capture.id}`);
  };

  const onError = (errors: FieldErrors<SaveAsCaptureFormFields>) => {
    if (errors.keep && errors.keep.type === 'too_small') {
      toast(`Make sure you've selected at least one image to keep!`);
      return;
    }

    console.log(errors);
    toast(`Make sure you've filled everything in!`);
  };

  // const [index, setIndex] = useState<number | undefined>(capture.data.images.length > 0 ? 0 : undefined);
  // const image = index !== undefined ? capture.data.images[index] : undefined;

  // const [keep, setKeep] = useFormState(methods, 'keep');
  // const [discard, setDiscard] = useFormState(methods, 'discard');
  // const [taxa, setTaxa] = useFormState(methods, 'taxa');

  // const [boundingBoxes, setBoundingBoxes] = useFormState(methods, `boundingBoxes.${image?.replace(/\./g, '_')}`);

  // const [editorMode, setEditorMode] = useState(false);
  // const pending = capture.data.images.length - keep.length - discard.length;

  // console.log(methods.getValues());

  return (
    <Form
      methods={methods}
      onSubmit={onSubmit}
      onError={onError}
      className="flex-1 bg-accent-100 p-8 flex flex-col gap-6 items-center"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.nav
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="w-full relative flex items-center justify-end z-10"
        >
          <Note className="w-fit absolute top-0 left-0 rounded-md min-w-96">
            <input
              {...methods.register('name')}
              autoFocus
              type="text"
              className="text-2xl font-medium px-3 outline-none bg-accent-50 placeholder:opacity-25 placeholder:text-accent-900"
              placeholder="Give your capture a name"
            />
            <p className="px-3 py-1 text-sm">
              Captured by <strong>{capture.data.capturedBy}</strong>
            </p>
            <p className="px-3 py-1 text-sm">
              Captured at{' '}
              <strong>
                <Timestamp date={new Date(capture.data.capturedAt)} />
              </strong>
            </p>
          </Note>

          <div className="flex items-center gap-2">
            <Button type="submit" shortcut="S">
              <Save />
              Save
            </Button>
          </div>
        </motion.nav>
      </AnimatePresence>
      <div className="w-full relative flex-1">
        <div className={cn('h-full flex items-center justify-stretch transition-transform')}>
          <Media.Root>
            <Media.Container className="w-full">
              <Media.Video
                className="w-full aspect-video object-cover border-[6px] border-accent-300 rounded-md"
                muted
                loop
                src={'https://file-examples.com/storage/fe40e015d566f1504935cfd/2017/04/file_example_MP4_480_1_5MG.mp4'}
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              />
            </Media.Container>
            <Media.Viewport className="mt-8">
              <Metadata />
            </Media.Viewport>
          </Media.Root>
        </div>
      </div>
    </Form>
  );
};

import * as Slider from '@radix-ui/react-slider';
import { ProgressBarRoot } from '@react-av/sliders';

export const Playhead = () => {
  return (
    <Slider.Thumb className="block w-[3px] h-[128px] bg-white outline-none">
      <svg className="absolute -top-1 left-1/2 -translate-x-1/2" width="18" viewBox="0 0 14 11" fill="none">
        <path
          d="M7.86602 10.5C7.48112 11.1667 6.51887 11.1667 6.13397 10.5L0.93782 1.5C0.55292 0.833332 1.03405 -2.67268e-07 1.80385 -1.9997e-07L12.1962 7.08554e-07C12.966 7.75852e-07 13.4471 0.833334 13.0622 1.5L7.86602 10.5Z"
          fill="white"
        />
      </svg>
    </Slider.Thumb>
  );
};

export const Metadata = () => {
  const duration = Media.useMediaDuration();

  return (
    <div className="bg-accent-300 px-6 pt-2 pb-4 rounded-lg">
      <div className="flex gap-2 items-end">
        <Controls.PlayPause />
        <div className="flex-1 grid grid-flow-col items-center relative">
          <ProgressBarRoot className="absolute inset-0 z-10">
            <Slider.Track className="absolute inset-0"></Slider.Track>
            <Playhead />
          </ProgressBarRoot>
          {new Array(Math.ceil(duration)).fill(null).map((_, i) => (
            <Second key={i} second={i} />
          ))}
        </div>
      </div>
      <div className="col-span-full row-start-2 h-20 bg-accent-500 mt-4 rounded-md relative">
        <Slider.Root defaultValue={[43, 65]} className="absolute inset-0 z-10 flex items-center">
          <Slider.Track className="absolute inset-0">
            <Slider.Range className="absolute bg-white bg-opacity-20 border-[6px] border-white rounded-md h-full" />
          </Slider.Track>
          <Slider.Thumb className="block w-5 h-12 border-4 border-white bg-accent-500 rounded-md" />
          <Slider.Thumb className="block w-5 h-12 border-4 border-white bg-accent-500 rounded-md" />
        </Slider.Root>
      </div>
    </div>
  );
};

export const Tick: FC<HTMLMotionProps<'span'>> = ({ className, ...props }) => {
  return (
    <motion.span
      initial={{ height: '0.5rem' }}
      animate={{ height: '1rem' }}
      className={cn('w-[2px] bg-accent-900 bg-opacity-45', className)}
      {...props}
    ></motion.span>
  );
};

export const SubTick: FC<HTMLMotionProps<'span'>> = ({ className, ...props }) => {
  return (
    <motion.span
      style={{ height: '0.5rem' }}
      className={cn('w-[2px] bg-accent-900 bg-opacity-45', className)}
      {...props}
    ></motion.span>
  );
};

interface SecondProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The start time of the second, i.e. 00:00 - 00:01 would be 0.
   */
  second: number;
}

const ZeroWidthSpace = '\u200B';

/*
  This component is used to display a second in the timeline.
  It is used to display the time of the second and the tick marks.
  It uses the container query to determine the screen size and the visibility of the tick marks and the time.

  The time is displayed in the format mm:ss.
  If the second is the start of the end, always show it.
*/
export const Second: FC<SecondProps> = ({ second }) => {
  const duration = Media.useMediaDuration();
  const proportion = second / duration;
  return (
    <div className="@container">
      <div className="flex items-center gap-2 relative">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: proportion * 0.2 }}
          className={cn('text-xs font-medium text-accent-900', second % 5 !== 0 && 'hidden')}
        >
          {format(new Date(new Date().setMinutes(Math.floor(second / 60))).setSeconds(second % 60), 'mm:ss')}
        </motion.p>
        <p>{ZeroWidthSpace}</p>
      </div>

      <div className="grid grid-flow-col h-4">
        <Tick transition={{ delay: proportion * 0.2 }} />
        <SubTick transition={{ delay: proportion * 0.2 }} className="hidden @[20px]:block" />
        <SubTick transition={{ delay: proportion * 0.2 }} className="hidden @[10px]:block" />
      </div>
    </div>
  );
};
