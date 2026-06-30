import { Clipboard } from '@/layouts/Clipboard';
import { FC } from 'react';

export const LaunchDay: FC = () => {
  return (
    <Clipboard
      container={{ className: 'max-w-3xl' }}
      className="text-accent-900 min-h-screen md:px-12 md:py-20 flex flex-col gap-4"
    >
      <h2 className="text-2xl font-bold">Launch day & rebalancing</h2>
      <p>
        Thank you all so much for joining in on the opening day of the Alveus Pollinator Census! Together we submitted{' '}
        <span className="font-bold">
          400 clips, 900 suggestions, 28,000 pieces of feedback, 36,000 achievements and earned 1,324,620 points!
        </span>{' '}
        A huge start to the project, thank you very much for taking part!
      </p>
      <p>
        Moving past the launch day and to prioritise the quality of data that we're collecting, we are going to start
        enforcing a few rules and do some points rebalancing!
      </p>
      <h3 className="text-lg font-bold pt-4">Feedback</h3>
      <p>
        You can now only agree to one suggestion per submission. If you see another suggestion that is more specific or
        you change your mind, you can swap your agreement to it at any point.
      </p>
      <p>
        You can disagree with as many suggestions as you'd like but you will only be awarded points for your first per
        submission.
      </p>
      <p>
        These limits apply to plant suggestions and critter suggestions separately. Voting without a comment is now 10
        points, voting with a comment is 30 points.
      </p>
      <p>
        For comments, we will now start enforcing that they must be constructive and useful to help the community
        understand your feedback.{' '}
      </p>
      <p>Valid comments:</p>
      <ul className="list-disc list-inside">
        <li>arrow waist between the thorax and abdomen and a segmented body typical for ants</li>
        <li>black bands with white outlines on wings</li>
        <li>body size looks too small in comparison to that on iNaturalist</li>
        <li>curved beak makes me think its a house finch</li>
      </ul>
      <p>Invalid comments:</p>
      <ul className="list-disc list-inside">
        <li>correct</li>
        <li>Cos it is</li>
        <li>could be</li>
        <li>Cause maya said so</li>
      </ul>
      <h3 className="text-lg font-bold pt-4">Submissions</h3>
      <p>
        To ensure the quality of submissions, we will start removing submissions that aren't clear enough to use in the
        dataset.
      </p>
      <p>
        If your submission is of nothing, an ambassador or a person, the submission will be removed and you won't be
        awarded points.
      </p>
      <p>
        If your submission is too blurry, too smeared or too obscured, the submission will be removed but you will keep
        your points.
      </p>
      <p>
        If your submission is clearly of the same subject, captured at the same time as another submission, all those
        submissions will be merged into one and you will keep your points.
      </p>
      <p>All feedback on a removed submission will also be deleted and the points revoked.</p>
      <p>
        These limits are now active and they will be applied retroactively to existing submissions over the next day.
      </p>
      <p>Again, thank you all so much for taking part and I can't wait to see what you all spot next!</p>
    </Clipboard>
  );
};
