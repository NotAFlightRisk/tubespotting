import { LOCALES, type Locale, type Plural } from './locales.js';
import en, { type Messages } from './messages/en.js';

const translations = import.meta.glob<Messages>(['./messages/*.ts', '!./messages/en.ts'], {
  import: 'default'
});

/** Everything the page says, swapped in place so whatever's showing it follows along */
export const t: Messages = $state({ ...en });

let locale = $state<Locale>('en');
let wanted: Locale = 'en';

const formats = $derived.by(() => {
  const { tag } = LOCALES[locale];
  return {
    plural: new Intl.PluralRules(tag),
    list: new Intl.ListFormat(tag),
    clock: new Intl.DateTimeFormat(tag, { timeStyle: 'medium', timeZone: 'Europe/London' })
  };
});

export const count = (forms: Plural, n: number) =>
  (forms[formats.plural.select(n)] ?? forms.other).replace('#', String(n));
export const list = (items: string[]) => formats.list.format(items);
export const clock = (at: number) => formats.clock.format(at);

const messagesFor = (code: Locale) =>
  code === 'en' ? Promise.resolve(en) : translations[`./messages/${code}.ts`]();

export async function setLocale(code: Locale) {
  wanted = code;
  // a deploy since the page opened takes its old chunks away, so it stays as it is
  const messages = await messagesFor(code).catch(() => null);
  if (!messages || code !== wanted || code === locale) return;
  Object.assign(t, messages);
  locale = code;
  document.documentElement.lang = LOCALES[code].tag;
}
