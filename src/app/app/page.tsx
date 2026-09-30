"use client";

import { useMemo, useState } from "react";
import styles from "../page.module.css";

type Task = { id: number; title: string; time: string; done: boolean; tag: string };
const initialTasks: Task[] = [
  { id: 1, title: "Подготовить план на неделю", time: "09:30", done: true, tag: "Личное" },
  { id: 2, title: "Закончить макет главной страницы", time: "11:00", done: false, tag: "Проект" },
  { id: 3, title: "Прочитать главу по базам данных", time: "14:00", done: false, tag: "Учёба" },
  { id: 4, title: "Прогулка", time: "18:30", done: false, tag: "Привычки" },
];
const navigation = ["Обзор", "Задачи", "Календарь", "Привычки", "Финансы", "Заметки"];

export default function Home() {
  const [active, setActive] = useState("Обзор");
  const [tasks, setTasks] = useState(initialTasks);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const visibleTasks = useMemo(() => tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase())), [tasks, query]);
  const completed = tasks.filter((task) => task.done).length;

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    setTasks((current) => [...current, { id: Date.now(), title: draft.trim(), time: "Без времени", done: false, tag: "Личное" }]);
    setDraft("");
    setAdding(false);
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <a className={styles.brand} href="#overview"><span className={styles.brandMark}>m</span><span>myhelper<small>личное пространство</small></span></a>
        <div className={styles.workspaceLabel}>РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <nav className={styles.nav} aria-label="Основная навигация">
          {navigation.map((item, index) => <button key={item} className={`${styles.navItem} ${active === item ? styles.navActive : ""}`} onClick={() => setActive(item)}><span className={styles.navIcon}>{["⌂", "◷", "▦", "✳", "₽", "▤"][index]}</span>{item}{item === "Задачи" && <span className={styles.navCount}>{tasks.filter((task) => !task.done).length}</span>}</button>)}
        </nav>
        <div className={styles.sidebarBottom}><div className={styles.avatar}>А</div><div><strong>Александр</strong><small>Моё пространство</small></div><button className={styles.moreButton} aria-label="Настройки">···</button></div>
      </aside>
      <section className={styles.mainPanel} id="overview">
        <header className={styles.topbar}><div className={styles.breadcrumb}>Моё пространство <span>/</span> {active}</div><div className={styles.topActions}><button className={styles.iconButton} aria-label="Уведомления">♧</button><button className={styles.helpButton}>? <span>Помощь</span></button></div></header>
        <div className={styles.content}>
          <div className={styles.greetingRow}><div><div className={styles.dateLabel}>СРЕДА, 30 СЕНТЯБРЯ</div><h1>{active === "Обзор" ? "Хороший день для важных дел" : active}</h1><p className={styles.subtitle}>Вот что происходит в вашем пространстве сегодня.</p></div><button className={styles.primaryButton} onClick={() => setAdding(true)}><span>＋</span> Новая задача</button></div>
          <div className={styles.statsGrid}>
            <article className={styles.statCard}><div className={styles.statTop}><span>Задачи на сегодня</span><span className={`${styles.statIcon} ${styles.purple}`}>◷</span></div><div className={styles.statValue}>{tasks.length - completed}<small> / {tasks.length}</small></div><div className={styles.progressTrack}><span style={{ width: `${tasks.length ? (completed / tasks.length) * 100 : 0}%` }} /></div><div className={styles.statFoot}>{completed} выполнено</div></article>
            <article className={styles.statCard}><div className={styles.statTop}><span>Привычки</span><span className={`${styles.statIcon} ${styles.green}`}>✳</span></div><div className={styles.statValue}>2<small> / 4</small></div><div className={styles.statFoot}><span className={styles.positive}>↗ 3 дня</span> серия выполнений</div></article>
            <article className={styles.statCard}><div className={styles.statTop}><span>Баланс за месяц</span><span className={`${styles.statIcon} ${styles.blue}`}>₽</span></div><div className={styles.statValue}>₽ 24 850</div><div className={styles.statFoot}>Доходы минус расходы</div></article>
            <article className={styles.statCard}><div className={styles.statTop}><span>Заметки</span><span className={`${styles.statIcon} ${styles.orange}`}>▤</span></div><div className={styles.statValue}>12</div><div className={styles.statFoot}>Обновлено недавно</div></article>
          </div>
          <div className={styles.dashboardGrid}>
            <section className={styles.panel}><div className={styles.panelHeader}><div><h2>План на сегодня</h2><p>{completed} из {tasks.length} задач выполнено</p></div><button className={styles.textButton} onClick={() => setActive("Задачи")}>Все задачи <span>→</span></button></div>
              {adding && <form className={styles.addForm} onSubmit={addTask}><input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Что нужно сделать?" aria-label="Название задачи"/><button type="submit">Добавить</button><button type="button" onClick={() => setAdding(false)} aria-label="Отмена">×</button></form>}
              <label className={styles.searchBox}><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти задачу..." /></label>
              <div className={styles.taskList}>{visibleTasks.map((task) => <div className={styles.taskRow} key={task.id}><button className={`${styles.check} ${task.done ? styles.checked : ""}`} onClick={() => setTasks((current) => current.map((entry) => entry.id === task.id ? { ...entry, done: !entry.done } : entry))} aria-label={task.done ? "Вернуть задачу" : "Отметить выполненной"}>{task.done && "✓"}</button><div className={styles.taskInfo}><strong className={task.done ? styles.taskDone : ""}>{task.title}</strong><small>{task.time}</small></div><span className={styles.tag}>{task.tag}</span><button className={styles.rowMore} aria-label="Действия">···</button></div>)}{visibleTasks.length === 0 && <div className={styles.empty}>Ничего не найдено</div>}</div>
              <button className={styles.addLink} onClick={() => setAdding(true)}>＋ Добавить задачу</button>
            </section>
            <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Ближайшие события</h2><p>Ваш календарь на неделю</p></div><button className={styles.textButton} onClick={() => setActive("Календарь")}>Календарь <span>→</span></button></div>
              <div className={styles.calendar}><div className={styles.calendarHeading}><button aria-label="Предыдущая неделя">‹</button><strong>Сентябрь 2026</strong><button aria-label="Следующая неделя">›</button></div><div className={styles.week}>{["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"].map((d, i) => <div key={d}><small>{d}</small><span className={i === 2 ? styles.today : ""}>{[28, 29, 30, 1, 2, 3, 4][i]}</span>{i === 2 && <i />}</div>)}</div></div>
              <div className={styles.events}><div className={styles.event}><span className={`${styles.eventDot} ${styles.dotPurple}`} /><div><strong>Закончить макет</strong><small>Сегодня, 11:00 · Проект</small></div></div><div className={styles.event}><span className={`${styles.eventDot} ${styles.dotBlue}`} /><div><strong>Встреча с командой</strong><small>Завтра, 15:30 · Работа</small></div></div><div className={styles.event}><span className={`${styles.eventDot} ${styles.dotOrange}`} /><div><strong>Сдать курсовую</strong><small>Пятница, 23:59 · Учёба</small></div></div></div>
            </section>
          </div>
          <footer className={styles.footer}>Маленькие шаги тоже ведут к большим целям <span>✦</span></footer>
        </div>
      </section>
    </main>
  );
}

