"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError, getToken } from "@/lib/api";
import { COMMUNITIES } from "@/lib/calgary";
import { MOVES } from "@/lib/rules";
import type { Profile } from "@/lib/types";
import { PhotoButton, PrivatePhoto } from "./Photos";
import { ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON, SECONDARY_BUTTON } from "./Shared";

// The real-person profile: first name, an optional photo, Calgary community, and 18+.
export function ProfileForm({ submitLabel, onSaved }: { submitLabel: string; onSaved: (profile: Profile) => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [community, setCommunity] = useState("");
  const [adult, setAdult] = useState(false);
  const [moves, setMoves] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Profile>("/api/account", { token: getToken() })
      .then((saved) => {
        setProfile(saved);
        setFirstName(saved.firstName ?? "");
        setCommunity(saved.community ?? "");
        setAdult(saved.adult);
        setMoves(saved.moves);
      })
      .catch(() => setError("We couldn't load your profile. Please try again."));
  }, []);

  async function save(changes: object, setLoading: (value: boolean) => void) {
    setLoading(true);
    setError("");
    try {
      const saved = await api<Profile>("/api/account", { body: changes, token: getToken() });
      setProfile(saved);
      return saved;
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : "Something went wrong. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved = await save({ firstName, community, moves, ...(adult ? { adult: true } : {}) }, setBusy);
    if (saved?.profileComplete) onSaved(saved);
    else if (saved) setError("Please confirm you're 18 or older.");
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-4">
        {profile?.photoId ? (
          <PrivatePhoto kind="profile" id={profile.photoId} alt="Your profile photo" className="size-24 shrink-0 border border-line rounded-2xl" />
        ) : (
          <div aria-hidden="true" className="flex size-24 shrink-0 items-center justify-center border-2 border-dashed border-line rounded-2xl text-4xl font-bold">
            ?
          </div>
        )}
        <div className="grid flex-1 gap-2">
          <PhotoButton
            label={photoBusy ? "Checking photo..." : profile?.photoId ? "Change photo" : "Add a photo"}
            className={SECONDARY_BUTTON}
            disabled={photoBusy}
            onPhoto={(photo) => save({ photo }, setPhotoBusy)}
          />
          {profile?.photoId && (
            <button type="button" className={QUIET_BUTTON} onClick={() => save({ photo: null }, setPhotoBusy)}>
              Remove photo
            </button>
          )}
        </div>
      </div>
      <p className="text-muted">Optional, but partners trust a real face more. Every photo is checked before your partner sees it.</p>

      <div>
        <label htmlFor="first-name" className="px-label">
          First name
        </label>
        <input
          id="first-name"
          className="px-input"
          required
          maxLength={30}
          autoComplete="given-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <p className="mt-1 text-muted">First name only. Your partner sees it.</p>
      </div>

      <div>
        <label htmlFor="community" className="px-label">
          Your Calgary community
        </label>
        <select id="community" className="px-input" required value={community} onChange={(event) => setCommunity(event.target.value)}>
          <option value="">Choose your community</option>
          {COMMUNITIES.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name} ({option.area})
            </option>
          ))}
        </select>
        <p className="mt-1 text-muted">We show you people nearby. Your exact address is never asked for, and partners never meet through the app.</p>
      </div>

      <fieldset>
        <legend className="px-label">How do you move? (optional)</legend>
        <p className="mb-2 text-muted">So we can show you people who move like you, and goals that fit. Leave it if you&apos;d rather not say.</p>
        <div className="grid gap-2">
          {[...Object.entries(MOVES).map(([value, option]) => ({ value, label: option.label })), { value: null, label: "I'd rather not say" }].map((option) => (
            <label key={option.label} className="flex min-h-12 cursor-pointer items-center gap-3 border border-line bg-white px-3 has-checked:bg-[#fffc00]">
              <input type="radio" name="moves" checked={moves === option.value} onChange={() => setMoves(option.value)} className="size-5 shrink-0 accent-ink" />
              <span className="font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex min-h-12 cursor-pointer items-center gap-3">
        <input type="checkbox" checked={adult} disabled={profile?.adult} onChange={(event) => setAdult(event.target.checked)} className="size-6 shrink-0 accent-ink" />
        <span className="font-semibold">I&apos;m 18 or older</span>
      </label>

      {error && <ErrorNote message={error} />}
      <button type="submit" disabled={busy || !firstName || !community || !adult} className={PRIMARY_BUTTON}>
        {busy ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
