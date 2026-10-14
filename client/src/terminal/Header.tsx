import { LANGS, TERMINAL_IDS, type Lang, type TerminalId } from '@lcn/shared';
import { t } from '../i18n.ts';
import { LogoMark } from './icons.tsx';

interface Props {
  lang: Lang;
  terminal: TerminalId;
  onLang(lang: Lang): void;
  onTerminal(id: TerminalId): void;
}

export function Header({ lang, terminal, onLang, onTerminal }: Props) {
  return (
    <header className="top">
      <div className="brand">
        <LogoMark />
        <div>
          <div className="brand-name">LvivCultureNav</div>
          <div className="brand-sub">{t(lang, 'sub')}</div>
        </div>
      </div>
      <div className="here" role="group" aria-label={t(lang, 'here')}>
        <span>{t(lang, 'here')}:</span>
        {TERMINAL_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className="chip-btn"
            aria-pressed={id === terminal}
            onClick={() => onTerminal(id)}
          >
            {t(lang, id)}
          </button>
        ))}
      </div>
      <nav className="langs" aria-label={t(lang, 'language')}>
        {LANGS.map((code) => (
          <button
            key={code}
            type="button"
            className="lang-btn"
            lang={code}
            aria-pressed={code === lang}
            onClick={() => onLang(code)}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </nav>
    </header>
  );
}
