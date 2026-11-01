// Season data is exported by the queries in ./data (see data/README.md).
import onboarding from './data/onboarding.json';
import stats from './data/stats.json';
import wrapped from './data/wrapped.json';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FramedImage {
  url: string;
  width: number;
  height: number;
  boundingBox: BoundingBox;
}

export interface CaptureImage extends FramedImage {
  nickname: string;
}

export interface Suggestion extends FramedImage {
  nickname: string;
  name: string;
  username: string;
}

export interface Comment {
  comment: string;
  username: string;
  nickname: string;
}

export interface Species {
  nickname: string;
  name: string;
  observations: number;
}

export interface FoundShiny {
  id: number;
  nickname: string;
  name: string;
  artwork: string;
  usernames: string[];
}

export interface Leader {
  username: string;
  points: number;
}

export interface SeasonData {
  signups: number;
  onboarding: {
    respondents: number;
    firstTimers: number;
    experienced: number;
    unclear: number;
    /** Self-rated bug skill, from "still learning" (0) to "expert" (3). */
    skillLevels: number[];
  };
  clips: number;
  captures: number;
  comments: number;
  suggestions: number;
  identificationsConfirmed: number;
  speciesConfirmed: number;
  shiniesFound: number;
  points: number;
  achievements: number;
  votes: number;
  top: Leader[];
  selections: {
    captures: CaptureImage[];
    comments: Comment[];
    suggestions: Suggestion[];
    species: Species[];
    shinies: FoundShiny[];
  };
}

export const season: SeasonData = {
  signups: stats.onboarded_distinct,
  onboarding: {
    respondents: onboarding.respondents,
    firstTimers: onboarding.first_timers,
    experienced: onboarding.experienced,
    unclear: onboarding.unclear,
    skillLevels: onboarding.skill_levels
  },
  clips: stats.clips_submitted,
  captures: stats.captures_made,
  comments: stats.comments,
  suggestions: stats.identifications,
  identificationsConfirmed: stats.identifications_confirmed,
  speciesConfirmed: stats.species_confirmed,
  shiniesFound: stats.shinies_found,
  points: stats.points,
  achievements: stats.achievements,
  votes: stats.votes,
  top: stats.top,
  selections: {
    captures: wrapped.captures ?? [],
    comments: wrapped.comments ?? [],
    suggestions: wrapped.suggestions ?? [],
    species: wrapped.species ?? [],
    shinies: wrapped.shinies ?? []
  }
};
