import { useEffect, useState } from 'react';
import { TERMINALS, isTerminalId, type Lang, type TerminalId } from '@lcn/shared';
import { t } from '../i18n.ts';
import { EventDetails } from './EventDetails.tsx';
import { EventList } from './EventList.tsx';
import { EventMap } from './EventMap.tsx';
import { Header } from './Header.tsx';
import { useEvents, useRoute } from './hooks.ts';
import { RoutePanel } from './RoutePanel.tsx';

/** Термінал визначається параметром ?terminal=station|center у адресі кіоску */
function terminalFromUrl(): TerminalId {
  const id = new URLSearchParams(window.location.search).get('terminal');
  return isTerminalId(id) ? id : 'station';
}

export function TerminalPage() {
  const [lang, setLang] = useState<Lang>('uk');
  const [terminal, setTerminal] = useState<TerminalId>(terminalFromUrl);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [routeOn, setRouteOn] = useState(false);

  const { events, status } = useEvents(lang);
  const route = useRoute(terminal, routeOn ? selectedId : null);
  const selected = events.find((e) => e.id === selectedId) ?? null;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const changeTerminal = (id: TerminalId) => {
    setTerminal(id);
    window.history.replaceState(null, '', `?terminal=${id}`);
  };

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
          route={route.status === 'ready' ? route.route : null}
          hereLabel={t(lang, 'here')}
          mapLabel={t(lang, 'map')}
          hint={t(lang, 'hint')}
          onSelect={setSelectedId}
        />
        <EventDetails event={selected} lang={lang}>
          <RoutePanel lang={lang} state={route} onToggle={() => setRouteOn((on) => !on)} />
        </EventDetails>
      </main>
    </div>
  );
}
