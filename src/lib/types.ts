export type EnergyFocus = 'consciousness' | 'external' | 'emotions' | 'intellect' | 'physical';

export type DiaryEntry = {
  bed?: string; wake?: string; sleep?: number;
  dreamsLogged?: boolean; dreams?: string; wakeMood?: string; wakeMoodWhy?: string;
  morningPractice?: string; morningMins?: number;
  divinity?: number; pray?: string; study?: string; studyLearned?: string;
  tongue?: string; service?: string; useless?: number;
  chastity?: boolean; ateConsciously?: boolean; ateProperly?: boolean;
  diet?: string; dietEffects?: string;
  mood?: number; moodWhy?: string; moodEffect?: string;
  mantras?: string; mantraAmount?: string; exercise?: string; exerciseEffects?: string;
  egoRestrained?: string; egoVisible?: string;
  liesCount?: number; liesDuration?: string; liesAnswer?: string;
  angerCount?: number; angerDuration?: string; angerAnswer?: string;
  lustCount?: number; lustDuration?: string; lustAnswer?: string;
  envyCount?: number; envyDuration?: string; envyAnswer?: string;
  fearCount?: number; fearDuration?: string; fearAnswer?: string;
  otherDefectName?: string; otherCount?: number; otherDuration?: string; otherAnswer?: string;
  habitFail?: string; habitDeal?: string;
  conc?: number; concWhy?: string; medMins?: number; medDetail?: string;
  retro?: string; retroLearned?: string;
  defectMed?: string; defectMedMins?: string; defectMedShowed?: string;
  virtue?: string; virtueLearned?: string; eradicate?: string; eradicateLearned?: string;
  obstacle?: string; antidote?: string; antidoteApplied?: boolean;
  aware?: number; mech?: number; energy?: EnergyFocus; tomorrow?: string;
  updatedAt?: number;
  cosmic?: { tarot?: string; dayRuler?: string; personalDay?: number };
};

export type Note = {
  id: string; title: string; body: string; tag: string;
  createdAt: number; updatedAt: number;
};

export type Profile = {
  fullName?: string; dob?: string; tob?: string; pob?: string; location?: string;
  type?: string; patternText?: string; selectedDefects?: string[];
  chiefDefect?: string; selectedBehaviours?: string[]; patternDesc?: string;
  shadow?: string; triggers?: string; belief?: string;
  teachers?: string; practices?: string; goal?: string; vows?: string;
  sun?: string; moon?: string; asc?: string; mercury?: string; venus?: string; mars?: string;
  chartNotes?: string; father?: string; mother?: string; sexuality?: string;
  critic?: string; bodyHeld?: string;
};

export type User = {
  id: string; name: string; pass: string; avatar: string;
  ledger: Record<string, DiaryEntry>; notes: Note[]; profile: Profile;
  createdAt: number;
};

export type AppState = { users: Record<string, User>; active: string | null };

export const DEFECTS = [
  { id: 'lies', title: 'Lies' },
  { id: 'anger', title: 'Anger' },
  { id: 'lust', title: 'Lust' },
  { id: 'envy', title: 'Envy' },
  { id: 'fear', title: 'Fear' },
] as const;

export const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=70',
  dawn: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=70',
  day: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70',
  night: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=70',
  sum: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=70',
  cosmos: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=70',
  notes: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=70',
};
