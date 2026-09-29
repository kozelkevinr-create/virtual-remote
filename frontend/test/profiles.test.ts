import { describe, expect, it } from "vitest";
import { matchesProfile, optionForProfile, profileIndexForState, slugify } from "../src/profiles";

const profiles = [
  { remoteId: "living_room_tv", name: "Living Room TV" },
  { remoteId: "apple_tv", name: "Apple TV" },
];

describe("profiles", () => {
  it("slugifies like HA for plain names", () => {
    expect(slugify("Living Room TV")).toBe("living_room_tv");
    expect(slugify("Café Stéréo")).toBe("cafe_stereo");
  });

  it("matches options by id or by name", () => {
    expect(matchesProfile("apple_tv", profiles[1])).toBe(true);
    expect(matchesProfile("Apple TV", profiles[1])).toBe(true);
    expect(matchesProfile("TV", profiles[1])).toBe(false);
    expect(matchesProfile("", profiles[1])).toBe(false);
  });

  it("finds the active profile from entity state", () => {
    expect(profileIndexForState(profiles, "Apple TV")).toBe(1);
    expect(profileIndexForState(profiles, "unknown")).toBe(-1);
    expect(profileIndexForState(profiles, undefined)).toBe(-1);
  });

  it("finds the option to select", () => {
    expect(optionForProfile(["Living Room TV", "Apple TV"], profiles[0])).toBe("Living Room TV");
    expect(optionForProfile(["Soundbar"], profiles[0])).toBeUndefined();
  });
});
