import type { Difficulty, TripType } from '@/types';

/* Trimmed port of the web's src/data/popularTrails.ts — trip form templates. */
export interface TrailTemplate {
  name: string;
  location: string;
  distance: number;
  elevationGain: number;
  difficulty: Difficulty;
  type: TripType;
}

export const POPULAR_TRAILS: TrailTemplate[] = [
  { name: 'Franconia Ridge Loop', location: 'Lincoln, NH', distance: 14.3, elevationGain: 1160, difficulty: 'HARD', type: 'DAY_HIKE' },
  { name: 'Mount Washington via Tuckerman Ravine', location: 'Pinkham Notch, NH', distance: 11.9, elevationGain: 1280, difficulty: 'HARD', type: 'DAY_HIKE' },
  { name: 'Sky Pond via Glacier Gorge', location: 'Rocky Mountain NP, CO', distance: 15.1, elevationGain: 550, difficulty: 'MODERATE', type: 'DAY_HIKE' },
  { name: 'Grays and Torreys', location: 'Arapahoe NF, CO', distance: 13.2, elevationGain: 930, difficulty: 'HARD', type: 'DAY_HIKE' },
  { name: 'The Narrows Top-Down', location: 'Zion NP, UT', distance: 25.7, elevationGain: 400, difficulty: 'HARD', type: 'OVERNIGHT' },
  { name: 'Presidential Traverse', location: 'White Mountains, NH', distance: 37, elevationGain: 2600, difficulty: 'EXTREME', type: 'OVERNIGHT' },
];
