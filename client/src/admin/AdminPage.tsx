import { useState } from 'react';
import type { EventFull } from '@lcn/shared';
import type { AdminApi } from '../api.ts';
import { EventForm } from './EventForm.tsx';
import { EventTable } from './EventTable.tsx';
import { LoginForm } from './LoginForm.tsx';
import { useAdminSession, type AdminSession } from './useAdminSession.ts';

/** Стан бічної форми: закрита, нова подія або редагування наявної */
type FormState = { mode: 'closed' } | { mode: 'new' } | { mode: 'edit'; id: number };

const CLOSED: FormState = { mode: 'closed' };

function AdminHeader({ onLogout }: { onLogout(): void }) {
  return (
    <header className="adm-top">
      <div className="brand">
        <span className="brand-name">LvivCultureNav</span>
        <span className="adm-sub">Адмін-панель</span>
      </div>
      <div className="adm-top-actions">
        <a className="btn small" href="/">
          Термінал
        </a>
        <button className="btn small" type="button" onClick={onLogout}>
          Вийти
        </button>
      </div>
    </header>
  );
}

function AdminWorkspace({ session, api }: { session: AdminSession; api: AdminApi }) {
  const [form, setForm] = useState<FormState>(CLOSED);
  const [notice, setNotice] = useState<string | null>(null);

  const editingId = form.mode === 'edit' ? form.id : null;
  const editing = session.events.find((e) => e.id === editingId);

  function open(next: FormState) {
    setNotice(null);
    setForm(next);
  }

  async function remove(event: EventFull) {
    if (!window.confirm(`Видалити подію «${event.translations.uk?.title}»?`)) return;
    await api.remove(event.id);
    if (editingId === event.id) setForm(CLOSED);
    setNotice('Подію видалено');
    await session.reload();
  }

  async function saved(event: EventFull, created: boolean) {
    setNotice(created ? 'Подію створено' : 'Зміни збережено');
    // Подія потрапляє в список одразу: інакше форма до перезавантаження списку
    // вважала б щойно створену подію новою, і повторне збереження створило б дублікат
    session.upsert(event);
    setForm({ mode: 'edit', id: event.id });
    await session.reload();
  }

  return (
    <div className="admin">
      <AdminHeader onLogout={session.logout} />
      <main className="adm-body">
        <section className="adm-list" aria-labelledby="adm-events">
          <div className="adm-list-head">
            <h1 id="adm-events">Події</h1>
            <button className="btn primary" type="button" onClick={() => open({ mode: 'new' })}>
              + Нова подія
            </button>
          </div>
          {notice && (
            <div className="toast" role="status">
              {notice}
            </div>
          )}
          <EventTable
            events={session.events}
            editingId={editingId}
            onEdit={(id) => open({ mode: 'edit', id })}
            onDelete={remove}
          />
        </section>
        {(form.mode === 'new' || editing) && (
          <EventForm
            key={editingId ?? 'new'}
            event={editing}
            api={api}
            onSaved={saved}
            onCancel={() => setForm(CLOSED)}
          />
        )}
      </main>
    </div>
  );
}

/** Сторінка /admin: вхід за ключем, далі — таблиця подій і форма (REQ-1.1) */
export function AdminPage() {
  const session = useAdminSession();
  if (!session.api) return <LoginForm onLogin={session.login} />;
  return <AdminWorkspace session={session} api={session.api} />;
}
