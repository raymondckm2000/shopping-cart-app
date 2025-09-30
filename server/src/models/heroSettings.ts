export interface HeroSettings {
  copy: string;
  backgroundImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UpdateHeroSettingsInput = {
  copy?: string;
  backgroundImageUrl?: string | null;
};
