import { HeroSettings, UpdateHeroSettingsInput } from '../models/heroSettings.js';

const defaultCopy = 'Discover the latest arrivals and exclusive deals tailored for you.';

class HeroSettingsStore {
  private settings: HeroSettings;

  constructor() {
    const now = new Date();
    this.settings = {
      copy: defaultCopy,
      createdAt: now,
      updatedAt: now,
    };
  }

  get() {
    return this.settings;
  }

  update(input: UpdateHeroSettingsInput) {
    const now = new Date();

    this.settings = {
      ...this.settings,
      copy: input.copy !== undefined ? input.copy : this.settings.copy,
      backgroundImageUrl:
        input.backgroundImageUrl === null
          ? undefined
          : input.backgroundImageUrl ?? this.settings.backgroundImageUrl,
      updatedAt: now,
    };

    return this.settings;
  }
}

const heroSettingsStore = new HeroSettingsStore();

export default heroSettingsStore;
export { HeroSettingsStore };
