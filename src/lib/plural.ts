/** "1 exercise", "3 exercises". English only; pass `plural` for irregular words. */
export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
