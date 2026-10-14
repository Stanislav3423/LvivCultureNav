import { useEffect, useState } from 'react';
import {
  TERMINALS,
  isTerminalId,
  type EventView,
  type Lang,
  type RouteResult,
  type TerminalId,
} from '@lcn/shared';
import { fetchEvents, fetchRoute } from '../api.ts';
import { t } from '../i18n.ts';
import { EventDetails } from './EventDetails.tsx';
import { EventList } from './EventList.tsx';
import { EventMap } from './EventMap.tsx';
import { Header } from './Header.tsx';
import { RoutePanel, type RouteState } from './RoutePanel.tsx';

/** Термінал визначається параметром ?terminal=station|center у адресі кіоску */
function terminalFromUrl(): TerminalId {
  const id = new URLSearchParams(window.location.search).get('terminal');
  return isTerminalId(id) ? id : 'station';
}

interface RouteResponse {
  key: string;
  route?: RouteResult;
  failed?: boolean;
}

export function TerminalPage() {
  const [lang, setLang] = useState<Lang>('uk');
  const [terminal, setTerminal] = useState<TerminalId>(terminalFromUrl);
  const [events, setEvents] = useState<EventView[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [routeOn, setRouteOn] = useState(false);
  const [routeResponse, setRouteResponse] = useState<RouteResponse | null>(null);

  // Зміна мови лише перезапитує контент — сторінка не перезавантажується (REQ-2.2)
  useEffect(() => {
    const ctrl = new AbortController();
    fetchEvents(lang, ctrl.signal)
      .then((list) => {
        setEvents(list);
        setStatus('ready');
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setStatus('error');
      });
    return () => ctrl.abort();
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Маршрут перебудовується, коли змінюється подія або термінал (REQ-2.3)
  const routeKey = routeOn && selectedId !== null ? `${terminal}:${selectedId}` : null;
  useEffect(() => {
    if (!routeKey) return;
    const [term, id] = routeKey.split(':') as [TerminalId, string];
    const ctrl = new AbortController();
    fetchRoute(term, Number(id), ctrl.signal)
      .then((route) => setRouteResponse({ key: routeKey, route }))
      .catch(() => {
        if (!ctrl.signal.aborted) setRouteResponse({ key: routeKey, failed: true });
      });
    return () => ctrl.abort();
  }, [routeKey]);

  let routeState: RouteState = { status: 'idle' };
  if (routeKey) {
    if (routeResponse?.key !== routeKey) routeState = { status: 'loading' };
    else if (routeResponse.route) routeState = { status: 'ready', route: routeResponse.route };
    else routeState = { status: 'error' };
  }

  const changeTerminal = (id: TerminalId) => {
    setTerminal(id);
    window.history.replaceState(null, '', `?terminal=${id}`);
  };

  const selected = events.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="terminal">
      <Header lang={lang} terminal={terminal} onLang={setLang} onTerminal={changeTerminal} />
      <main className="cols">
        <EventList
          events={events}
          lang={lang}
          selectedId={selectedId}
          status={status}
          onSelect={setSelectedId}
        />
        <EventMap
          events={events}
          selectedId={selectedId}
          terminal={TERMINALS[terminal]}
          route={routeState.status === 'ready' ? routeState.route : null}
          hereLabel={t(lang, 'here')}
          mapLabel={t(lang, 'map')}
          hint={t(lang, 'hint')}
          onSelect={setSelectedId}
        />
        <EventDetails event={selected} lang={lang}>
          <RoutePanel lang={lang} state={routeState} onToggle={() => setRouteOn((on) => !on)} />
        </EventDetails>
      </main>
    </div>
  );
}
