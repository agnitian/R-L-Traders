// Returns a usable avatar src for any user object.
// Uses uploaded `avatarUrl` if present, otherwise falls back to a deterministic
// male-only avatar based on the user's id/name/seed.
export function avatarSrcFor(userOrSeed) {
  if (userOrSeed && typeof userOrSeed === 'object') {
    if (userOrSeed.avatarUrl) return userOrSeed.avatarUrl;
    const seed = userOrSeed.id || userOrSeed.name || 'user';
    return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(seed)}`;
  }
  const seed = userOrSeed || 'user';
  return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(seed)}`;
}
