// "JOSE CRUZ DELA PEÑA III" -> "Jose Cruz Dela Peña III"
export const toDisplayName = (full: string) =>
  full
    .trim()
    .split(/\s+/)
    .map((w) => (/^(II|III|IV|V)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");

// First + last name initials, ignoring suffixes like JR or III
export const toInitials = (full: string) => {
  const words = full.trim().split(/\s+/).filter((w) => !/^(JR|SR|II|III|IV|V)\.?$/i.test(w));
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
};
