/** Split the optional platform headings without including labels or separators in copied text. */
export function splitCaptions(text) {
  const cleaned = text.replace(/\r\n?/g, '\n').replace(/^[ \t]*[-=]{4,}[ \t]*$/gm, '');
  const sections = /^\s*INSTAGRAM[ \t]*\n([\s\S]*?)^\s*YOUTUBE[ \t]*\n([\s\S]*)$/im.exec(cleaned);
  if (!sections) return { instagram: '', title: '', description: '', fallback: text.trim() };
  const youtube = sections[2].trim();
  const fields = /^\s*Title:[ \t]*\n([\s\S]*?)^\s*Description:[ \t]*\n([\s\S]*)$/im.exec(youtube);
  if (!fields) return { instagram: sections[1].trim(), title: '', description: '', fallback: youtube };
  return { instagram: sections[1].trim(), title: fields[1].trim(), description: fields[2].trim(), fallback: '' };
}
