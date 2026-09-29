// Profiles: several stored remotes in one card. The active one can live in an
// input_select/select entity so every device and automation shares it.

export interface ProfileInfo {
  remoteId: string;
  name: string;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** An option names a profile by its remote id or its name, in any case/spacing. */
export function matchesProfile(option: string, profile: ProfileInfo): boolean {
  const slug = slugify(option);
  return slug !== "" && (slug === profile.remoteId || slug === slugify(profile.name));
}

/** Index of the profile the entity's state points at, or -1. */
export function profileIndexForState(profiles: ProfileInfo[], state: string | undefined): number {
  if (!state) return -1;
  return profiles.findIndex((profile) => matchesProfile(state, profile));
}

/** The entity option to select for a profile, or undefined if none matches. */
export function optionForProfile(options: string[], profile: ProfileInfo): string | undefined {
  return options.find((option) => matchesProfile(option, profile));
}
