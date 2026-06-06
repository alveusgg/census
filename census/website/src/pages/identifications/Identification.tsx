import { Square } from '@/components/assets/images/Square';
import { Note } from '@/components/containers/Note';
import { DownThumb, UpThumb } from '@/components/controls/ObservationEntry';
import { Preloader } from '@/components/feed/Preloader';
import { Link } from '@/components/controls/button/paper';
import SiLink from '@/components/icons/SiLink';
import { Loader } from '@/components/loaders/Loader';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { Timestamp } from '@/components/text/Timestamp';
import { UserLink } from '@/components/users/UserLink';
import { useIdentification } from '@/services/api/identifications';
import type { Feedback, Identification as ObservationIdentification } from '@/services/api/observations';
import { cn } from '@/utils/cn';
import { useSuspenseQuery } from '@tanstack/react-query';
import { formatInTimeZone } from 'date-fns-tz';
import { FC, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Controls, SlidePips } from '../observations/gallery/Controls';
import { Slide } from '../observations/gallery/GalleryProvider';
import { Polaroid } from '../observations/gallery/Polaroid';

export interface IdentificationProps {
  identificationId: number;
}

const UserLinkList: FC<{ users: { id: number; username: string }[] }> = ({ users }) => {
  return (
    <>
      {users.map((user, index) => (
        <span key={`${user.id}-${index}`}>
          {index > 0 && ', '}
          <UserLink user={user} />
        </span>
      ))}
    </>
  );
};

const FeedbackPill: FC<{ type: Feedback['type']; count: number }> = ({ type, count }) => {
  if (count === 0) return null;

  const config = {
    agree: {
      icon: <UpThumb />,
      className: 'text-purple-600 bg-purple-50 border-purple-100',
      label: 'agree'
    },
    disagree: {
      icon: <DownThumb />,
      className: 'text-red-600 bg-red-50 border-red-100',
      label: 'disagree'
    },
    confirm: {
      icon: <SiLink className="text-lg" />,
      className: 'text-green-700 bg-green-50 border-green-100',
      label: 'confirmed'
    }
  }[type];

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-1 text-sm font-bold', config.className)}>
      {config.icon}
      {count} {config.label}
    </span>
  );
};

const FeedbackComments: FC<{ feedback: Feedback[] }> = ({ feedback }) => {
  const comments = feedback.filter(item => item.comment);

  if (comments.length === 0) {
    return <p className="text-sm text-accent-800 opacity-75">No comments yet.</p>;
  }

  return (
    <div className="divide-y divide-dashed divide-accent-300">
      {comments.map(comment => (
        <div key={comment.id} className="py-2 first:pt-0 last:pb-0">
          <p className="text-accent-900">{comment.comment}</p>
          <p className="mt-1 text-sm font-semibold text-accent-700">
            by <UserLink user={comment.submitter} />
          </p>
        </div>
      ))}
    </div>
  );
};

const RelatedIdentification: FC<{ identification: ObservationIdentification; active: boolean }> = ({
  identification,
  active
}) => {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2',
        active ? 'border-alveus bg-alveus/10 text-accent-900' : 'border-accent-200 bg-accent-50 text-accent-800'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{identification.nickname}</p>
          <p className="text-xs opacity-75">
            suggested by <UserLink user={identification.suggester} />
          </p>
        </div>
        {active && <span className="shrink-0 rounded-full bg-alveus px-2 py-0.5 text-xs font-bold text-white">current</span>}
      </div>
    </div>
  );
};

const Identification: FC<IdentificationProps> = ({ identificationId }) => {
  const query = useIdentification(identificationId);
  const identification = useSuspenseQuery(query);

  if (!identification.data?.observation) throw new Error('Observation not found');

  const observation = identification.data.observation;
  const selectedIdentification = observation.identifications.find(item => item.id === identification.data.id);
  if (!selectedIdentification) throw new Error('Identification not found on observation');

  const images = observation.sightings.flatMap(sighting => sighting.images);
  const feedback = selectedIdentification.feedback;
  const agreeCount = feedback.filter(item => item.type === 'agree').length;
  const disagreeCount = feedback.filter(item => item.type === 'disagree').length;
  const confirmCount = feedback.filter(item => item.type === 'confirm').length;
  const observedBy = observation.sightings.flatMap(sighting => sighting.observer);
  const capturedBy = observation.sightings.flatMap(sighting => sighting.capture.capturer);
  const relatedIdentifications = observation.identifications.filter(item => item.id !== selectedIdentification.id);

  return (
    <div className="@container w-full">
      <div className="flex gap-4 flex-col @lg:flex-row">
        <Polaroid>
          <Preloader>
            {images.map(image => (
              <Square
                key={image.id}
                src={image.url}
                image={{ width: image.width, height: image.height }}
                options={{ extract: image.boundingBox }}
              />
            ))}
          </Preloader>

          {images.map(image => (
            <Slide key={image.id} id={image.id.toString()}>
              <div className="w-full h-full overflow-clip relative">
                <Square
                  loading="lazy"
                  className="absolute inset-0 w-full h-full z-10"
                  src={image.url}
                  image={{ width: image.width, height: image.height }}
                  options={{ extract: image.boundingBox }}
                />
              </div>
            </Slide>
          ))}
          <Controls />
          <SlidePips />
        </Polaroid>
        <Note className="w-full h-fit">
          <div className="pb-3 pt-4 px-4 flex gap-6 justify-between items-start border-b border-dashed border-accent-300">
            <div className="min-w-0 leading-tight">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-accent-900">{identification.data.nickname}</h2>
                {identification.data.isAccessory && (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">plant</span>
                )}
                {identification.data.confirmedBy && (
                  <span className="rounded-full bg-alveus px-2 py-0.5 text-xs font-bold text-white">confirmed</span>
                )}
              </div>
              <p className="text-sm font-semibold text-accent-700">{identification.data.name}</p>
              <Timestamp date={observation.observedAt}>
                <p className="text-sm">
                  observed {formatInTimeZone(observation.observedAt, 'America/Chicago', 'MM/dd/yyyy hh:mma')}
                </p>
              </Timestamp>
            </div>
            <Link compact to={`https://www.inaturalist.org/taxa/${identification.data.sourceId}`}>
              <SiLink className="text-lg" />
              iNat
            </Link>
          </div>
          <div className="grid gap-4 px-4 py-4 @2xl:grid-cols-2">
            <section className="rounded-lg bg-accent-50 p-3">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-accent-700">People</h3>
              <div className="space-y-1 text-sm text-accent-900">
                <p>
                  suggested by <UserLink user={identification.data.suggester} className="font-semibold" />
                </p>
                <p>
                  confirmed by{' '}
                  {identification.data.confirmer ? (
                    <UserLink user={identification.data.confirmer} className="font-semibold" />
                  ) : (
                    <span className="font-semibold opacity-70">not confirmed yet</span>
                  )}
                </p>
                <p>
                  observed by <UserLinkList users={observedBy} />
                </p>
                <p>
                  captured by <UserLinkList users={capturedBy} />
                </p>
              </div>
            </section>
            <section className="rounded-lg bg-accent-50 p-3">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-accent-700">Feedback</h3>
              <div className="flex flex-wrap gap-2">
                <FeedbackPill type="agree" count={agreeCount} />
                <FeedbackPill type="disagree" count={disagreeCount} />
                <FeedbackPill type="confirm" count={confirmCount} />
                {feedback.length === 0 && <p className="text-sm text-accent-800 opacity-75">No feedback yet.</p>}
              </div>
            </section>
          </div>
          <section className="border-t border-dashed border-accent-300 px-4 py-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-accent-700">Comments</h3>
            <FeedbackComments feedback={feedback} />
          </section>
          {relatedIdentifications.length > 0 && (
            <section className="border-t border-dashed border-accent-300 px-4 py-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-accent-700">
                Other suggestions on this observation
              </h3>
              <div className="grid gap-2 @2xl:grid-cols-2">
                <RelatedIdentification identification={selectedIdentification} active />
                {relatedIdentifications.map(item => (
                  <RelatedIdentification key={item.id} identification={item} active={false} />
                ))}
              </div>
            </section>
          )}
        </Note>
      </div>
    </div>
  );
};

export const IdentificationModal: FC<ModalProps<IdentificationProps>> = props => {
  return (
    <Modal {...props} className="w-full max-w-5xl bg-accent-200 p-8">
      <Suspense fallback={<Loader className="m-24 text-accent-900 w-6 h-6 mx-auto" />}>
        {props.props?.identificationId && <Identification identificationId={props.props.identificationId} />}
      </Suspense>
    </Modal>
  );
};

export const IdentificationPage: FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goToAllIdentifications = () => navigate('/identifications');

  return (
    <IdentificationModal
      props={{ identificationId: Number(id) }}
      isOpen={true}
      open={goToAllIdentifications}
      close={goToAllIdentifications}
      toggle={goToAllIdentifications}
    />
  );
};
