import { FC } from 'react';
import { season } from './data';
import { FramedImg } from './primitives';

import butterfly from '@/assets/adult_butterfly.outlined.png';
import ladybird from '@/assets/adult_ladybird.outlined.png';
import anthill from '@/assets/anthill.outlined.png';
import flower from '@/assets/flower.outlined.png';
import magnifier from '@/assets/magnifying-glass.outlined.png';
import camera from '@/assets/polaroid-capture.outlined.png';

const stickers = [anthill, butterfly, ladybird, flower, magnifier, camera];

/**
 * Fetches every image the presentation will show as soon as the card mounts,
 * so later slides arrive with their pictures already cached. The framed
 * images are requested with exactly the options the slides use, which keeps
 * the URLs (and so the cache entries) identical.
 */
export const Preload: FC = () => (
  <div aria-hidden className="hidden">
    {season.selections.captures.map(image => (
      <FramedImg key={`capture-${image.url}`} image={image} alt="" />
    ))}
    {season.selections.suggestions.map((image, index) => (
      <FramedImg key={`suggestion-${image.url}-${index}`} image={image} size={128} alt="" />
    ))}
    {season.selections.shinies.map(shiny => (
      <img key={`shiny-${shiny.id}`} src={shiny.artwork} alt="" />
    ))}
    {stickers.map(src => (
      <img key={src} src={src} alt="" />
    ))}
  </div>
);
