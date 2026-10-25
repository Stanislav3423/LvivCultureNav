import type { HTMLInputTypeAttribute } from 'react';
import { LANGS, VALIDATION_ERRORS, type Lang } from '@lcn/shared';
import { ApiError } from '../api.ts';

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange(value: string): void;
  multiline?: boolean;
  type?: HTMLInputTypeAttribute;
  inputMode?: 'decimal';
  placeholder?: string;
}

export function TextField({ id, label, value, onChange, multiline, ...input }: TextFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} {...input} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

export function LangTabs({ lang, onChange }: { lang: Lang; onChange(lang: Lang): void }) {
  return (
    <div className="tabs" role="tablist" aria-label="Мова контенту">
      {LANGS.map((l) => (
        <button key={l} type="button" role="tab" aria-selected={l === lang} onClick={() => onChange(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// Повідомлення сервера (domain/validateEvent) українською для адміністратора
const MESSAGES: Record<string, string> = {
  [VALIDATION_ERRORS.ukRequired]: 'Потрібен український переклад',
  [VALIDATION_ERRORS.ukTitle]: 'Назва українською обов’язкова',
  [VALIDATION_ERRORS.ukVenue]: 'Місце українською обов’язкове',
  [VALIDATION_ERRORS.startsAt]: 'Вкажіть дату і час початку',
  [VALIDATION_ERRORS.coordinates]: 'Координати мають бути в межах Львова',
  [VALIDATION_ERRORS.mediaUrl]: 'Посилання на медіа має починатися з http:// або https://',
};

const GENERIC_ERROR = 'Перевірте правильність заповнення полів';

/** Помилка збереження → зрозумілі адміністратору повідомлення */
export function saveErrorMessages(err: unknown): string[] {
  if (!(err instanceof ApiError && err.status === 400)) {
    return ['Не вдалося зберегти: сервер недоступний. Спробуйте ще раз.'];
  }
  return err.details.length ? err.details.map((m) => MESSAGES[m] ?? GENERIC_ERROR) : [GENERIC_ERROR];
}

export function ErrorList({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="errors" role="alert">
      <b>Подію не збережено:</b>
      <ul>
        {errors.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
