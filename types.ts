
export enum Flavor {
  Mysterious = 'Mysterious',
  Humorous = 'Humorous',
  Dramatic = 'Dramatic',
  Suspenseful = 'Suspenseful',
  Romantic = 'Romantic',
}

export type LoreType = 'Character' | 'Race' | 'Faction' | 'Location' | 'Custom';

export type LoreItem = {
  id: string;
  type: LoreType;
  name: string;
  description: string;
  // For 'Custom' type
  customTypeName?: string;
  // For image attachment
  image?: {
    base64: string;
    mimeType: string;
  };
};

export type SupportingCharacterCategory = 'Friend' | 'Rival' | 'Enemy' | 'Neutral' | 'LoveInterest' | 'Family' | 'Recurring';

export type SupportingCharacter = {
  id: string;
  category: SupportingCharacterCategory;
  type: string | null;
  sliderValue: number; // 0-100
  description: string;
};

export type WorldGenOptions = {
  presets?: string[];
  // Fast options
  tone: 'Grounded' | 'Balanced' | 'Wild' | null;
  vibes: string[];
  magicScale: number;
  techScale: number;
  conflict: string | null;
  setting: string | null;
  factionCount: number | null;
  raceCount: number | null;
  mcRole: string | null;
  antagonistShape: string | null;
  generateNames: boolean;
  // Thorough options
  subgenre?: 'Low' | 'Epic' | 'Grimdark' | 'Noblebright' | 'Weird' | 'Slice of Life' | null;
  primaryBiome?: string | null;
  travelConstraint?: 'Weather' | 'Monsters' | 'Law' | 'Terrain' | 'Cost' | 'Magic / Tech Barriers' | null;
  scarceResource?: string;
  resourceController?: string;
  polity?: 'Empire' | 'City-states' | 'Tribal' | 'Federation' | null;
  justiceStyle?: 'Code' | 'Custom' | 'Clerical' | 'Might' | null;
  taboos?: string;
  virtues?: string;
  lingua?: 'One' | 'Shared' | 'Many' | null;
  religionPresence?: 'None' | 'Folk' | 'Organized' | 'Cults' | null;
  miracleTest?: 'Rare' | 'Common' | 'False/Illusions' | null;
  medicineType?: 'Herbal' | 'Alchemical' | 'Magical' | 'None' | null;
  medicineConstraint?: 'Cost' | 'Skill' | 'Taboo' | null;
  tensions?: string[];
  mcScar?: string;
  mcNeed?: string;
  mcSecret?: string;
  mcLine?: string;
  supportingCharacters?: SupportingCharacter[];
  antagonistFuture?: string;
  antagonistLine?: string;
  antagonistDoomClock?: string;
  travelRange?: string;
  supplyPain?: string;
  messageSpeed?: string;
  combatFeel?: 'Messy' | 'Technical' | 'Brutal' | 'Heroic' | null;
  importantInjuries?: string;
  visualAnchors?: string;
  hardNoGos?: string;
  softLimits?: string;
};

export type GeneratedWorldData = {
  worldName: string;
  premise: string;
  factions: Array<{ name: string; goal: string; method: string; resource: string; flaw: string; leaderArchetype?: string; leverage?: string; fractureRisk?: string; }>;
  races: Array<{ name: string; hallmark: string; limitation: string; quirk: string; physiologyQuirk?: string; socialRole?: string; prejudice?: string; gift?: string; }>;
  mainCharacter: { name: string; desire: string; fear: string; edge: string; problem: string; scar?: string; need?: string; secret?: string; lineInSand?: string; };
  antagonist: { name: string; motive: string; leverage: string; weakness: string; desiredFuture?: string; lineTheyWontCross?: string; doomClock?: string; };
  allies?: Array<{name: string; role: string; edge: string;}>;
  rival?: {name: string; obsession: string; blindSpot: string;};
  starterHooks: string[];
  // New thorough fields
  detailedSections?: {
      macro: string;
      magicTech: string;
      geography: string;
      economy: string;
      lawAndOrder: string;
      culture: string;
      religion: string;
      medicine: string;
      conflictWeb: string;
      logistics: string;
      combat: string;
      aesthetic: string;
  }
};