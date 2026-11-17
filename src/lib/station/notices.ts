/** What a notice says, whatever heading, label or dash TfL filed it under this time */
const gist = (text: string) =>
  text
    .replace(/^[^:]{0,40}:(?=\s)/, '')
    .replace(/^\W*no step free access\b/i, '')
    .replace(/\W+/g, '')
    .toLowerCase();

/** A place's notices, each said once, minus any that a line's status says already */
export function placeNotices(notices: string[], reasons: (string | null)[]): string[] {
  const said = new Set(reasons.flatMap((reason) => (reason ? [gist(reason)] : [])));
  return notices.filter((notice) => {
    const key = gist(notice);
    if (said.has(key)) return false;
    said.add(key);
    return true;
  });
}
