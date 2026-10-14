import type { Lang, RouteResult } from '@lcn/shared';
import { formatDistance, t } from '../i18n.ts';
import { RouteIcon } from './icons.tsx';

export type RouteState =
  { status: 'idle' } | { status: 'loading' } | { status: 'ready'; route: RouteResult } | { status: 'error' };

interface Props {
  lang: Lang;
  state: RouteState;
  onToggle(): void;
}

export function RoutePanel({ lang, state, onToggle }: Props) {
  const shown = state.status !== 'idle';
  return (
    <>
      {state.status === 'loading' && (
        <div className="route-card">
          <div className="route-note">{t(lang, 'buildingRoute')}</div>
        </div>
      )}
      {state.status === 'error' && (
        <div className="route-card error" role="alert">
          {t(lang, 'routeError')}
        </div>
      )}
      {state.status === 'ready' && (
        <div
          className={state.route.mode === 'fallback' ? 'route-card fallback' : 'route-card'}
          data-testid="route-card"
        >
          <div className="route-big">
            {formatDistance(state.route.distanceMeters, lang)} · {state.route.durationMinutes}{' '}
            {t(lang, 'min')} {t(lang, 'walk')}
          </div>
          <div className="route-note">
            {t(lang, state.route.mode === 'fallback' ? 'fallbackRoute' : 'onlineRoute')}
          </div>
        </div>
      )}
      <button type="button" className="btn-primary" onClick={onToggle}>
        <RouteIcon />
        {t(lang, shown ? 'hideRoute' : 'route')}
      </button>
    </>
  );
}
