import Link from "next/link";
import { Plus } from "lucide-react";
import { asc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ModuleShell } from "@/components/app/ModuleShell";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { authOptions } from "@/auth";
import { db } from "@/db";
import { noteFolders, notes } from "@/db/schema";
import { createFolder, createNote, deleteFolder, deleteNote, updateNote } from "../modules/actions";

type Params = Promise<{ q?: string; folder?: string; error?: string; created?: string }>;

export default async function NotesPage({ searchParams }: { searchParams: Params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) redirect("/auth/login");
  const params = await searchParams;
  const [folders, allNotes] = await Promise.all([
    db.select().from(noteFolders).where(eq(noteFolders.userId, session.user.id)).orderBy(asc(noteFolders.name)),
    db.select().from(notes).where(eq(notes.userId, session.user.id)).orderBy(asc(notes.updatedAt)),
  ]);
  const query = params.q?.trim().toLocaleLowerCase("ru-RU") ?? "";
  const filtered = allNotes.filter((note) => {
    const matchesFolder = !params.folder || note.folderId === params.folder;
    const matchesQuery = !query || note.title.toLocaleLowerCase("ru-RU").includes(query) || note.content.toLocaleLowerCase("ru-RU").includes(query) || note.tags.some((tag) => tag.includes(query));
    return matchesFolder && matchesQuery;
  });
  const errorText = params.error === "duplicate-folder" ? "Папка с таким названием уже есть." : params.error ? "Проверьте название, содержание и теги." : null;
  return <ModuleShell active="Заметки" userLabel={session.user.name ?? session.user.email ?? "Аккаунт"}>
    <div><p className="text-[10px] font-semibold tracking-[.14em] text-[#898b9c]">ИДЕИ И ЗАПИСИ</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.045em]">Заметки</h1><p className="mt-2 text-sm text-[#858697]">Сохраняйте мысли, распределяйте по папкам и находите по тексту или тегам.</p></div>
    <form action="/app/notes" className="mt-6 flex gap-2"><input name="q" defaultValue={params.q} placeholder="Поиск по заголовку, тексту или тегу" className="min-w-0 flex-1 rounded-xl border border-[#e7e7ee] bg-white px-4 py-3 text-sm outline-none focus:border-[#817beb]"/><button className="rounded-xl border border-[#e7e7ee] bg-white px-4 text-sm text-[#625cf0]">Найти</button></form>
    <div className="mt-5 grid gap-5 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-2xl border border-[#e9e9f0] bg-white p-4"><h2 className="text-sm font-semibold">Папки</h2><Link href="/app/notes" className={`mt-3 block rounded-lg px-3 py-2 text-xs ${!params.folder ? "bg-[#f0efff] text-[#5e58e8]" : "text-[#737588] hover:bg-[#f7f7fb]"}`}>Все заметки <span className="float-right">{allNotes.length}</span></Link>{folders.map((folder) => <div key={folder.id} className="flex items-center gap-2"><Link href={`/app/notes?folder=${folder.id}`} className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-xs ${params.folder === folder.id ? "bg-[#f0efff] text-[#5e58e8]" : "text-[#737588] hover:bg-[#f7f7fb]"}`}>{folder.name}</Link><ConfirmAction title="Удалить папку" description="Заметки останутся, но перестанут быть привязаны к этой папке." action={deleteFolder} fields={{ id: folder.id }}/></div>)}<div className="mt-4 border-t border-[#f0f0f4] pt-4"><Modal title="Новая папка" description="Сгруппируйте заметки по проектам или темам." trigger={<><Plus aria-hidden="true" size={14}/><span>Создать папку</span></>} triggerClassName="mb-3 rounded-lg bg-[#f0efff] px-3 py-2 text-xs font-medium text-[#5e58e8]"><form action={createFolder} className="flex gap-2"><input required name="name" maxLength={80} placeholder="Новая папка" className="min-w-0 flex-1 rounded-lg border border-[#e7e7ee] px-2.5 py-2 text-xs"/><button aria-label="Создать папку" className="grid h-8 w-9 place-items-center rounded-lg bg-[#f0efff] text-[#5e58e8]"><Plus aria-hidden="true" size={14}/></button></form></Modal></div></aside>
      <div className="space-y-5">
        <div><Modal title="Новая заметка" description="Запишите мысль, добавьте теги и выберите папку." trigger={<><Plus aria-hidden="true" size={15}/><span>Новая заметка</span></>}><form action={createNote} className="grid gap-3"><input required name="title" maxLength={200} placeholder="Заголовок" className="rounded-xl border border-[#e7e7ee] px-4 py-3 text-sm outline-none focus:border-[#817beb]"/><textarea name="content" maxLength={20000} rows={4} placeholder="Запишите свою мысль…" className="resize-y rounded-xl border border-[#e7e7ee] px-4 py-3 text-sm outline-none focus:border-[#817beb]"/><div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><CustomSelect name="folderId" options={[{ value: "", label: "Без папки" }, ...folders.map((folder) => ({ value: folder.id, label: folder.name }))]}/><input name="tags" placeholder="Теги через запятую" className="rounded-xl border border-[#e7e7ee] px-3 py-2.5 text-xs"/><button className="rounded-xl bg-[#625cf0] px-4 py-2.5 text-xs font-semibold text-white">Сохранить</button></div></form></Modal>{errorText && <p role="alert" className="mt-3 text-xs text-red-600">{errorText}</p>}{params.created && <p className="mt-3 text-xs text-emerald-700">Заметка сохранена.</p>}</div>
        <div className="grid gap-4">{filtered.length ? filtered.map((note) => <article key={note.id} className="rounded-2xl border border-[#e9e9f0] bg-white p-5"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">{note.title}</h2><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#737588]">{note.content || "Без текста"}</p><div className="mt-3 flex flex-wrap gap-2">{note.folderId && <span className="rounded-full bg-[#f5f5f8] px-2.5 py-1 text-[10px] text-[#737588]">{folders.find((folder) => folder.id === note.folderId)?.name ?? "Папка"}</span>}{note.tags.map((tag) => <span key={tag} className="rounded-full bg-[#f0efff] px-2.5 py-1 text-[10px] text-[#625cf0]">#{tag}</span>)}</div></div><ConfirmAction title="Удалить заметку" description="Заметка будет удалена без возможности восстановления." action={deleteNote} fields={{ id: note.id }}/></div><Modal title="Редактировать заметку" description="Обновите текст, папку или теги." trigger="Редактировать" triggerClassName="mt-4 border-t border-[#f0f0f4] pt-3 cursor-pointer text-xs font-medium text-[#625cf0]"><form action={updateNote} className="grid gap-2"><input type="hidden" name="id" value={note.id}/><input required name="title" maxLength={200} defaultValue={note.title} className="rounded-lg border border-[#e7e7ee] px-3 py-2 text-xs"/><textarea name="content" maxLength={20000} rows={3} defaultValue={note.content} className="rounded-lg border border-[#e7e7ee] px-3 py-2 text-xs"/><div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><CustomSelect name="folderId" defaultValue={note.folderId ?? ""} options={[{ value: "", label: "Без папки" }, ...folders.map((folder) => ({ value: folder.id, label: folder.name }))]}/><input name="tags" defaultValue={note.tags.join(", ")} placeholder="Теги через запятую" className="rounded-lg border border-[#e7e7ee] px-3 py-2 text-xs"/><button className="rounded-lg bg-[#f0efff] px-3 py-2 text-xs font-medium text-[#5e58e8]">Сохранить</button></div></form></Modal></article>) : <div className="rounded-2xl border border-dashed border-[#dcdce7] px-5 py-10 text-center text-sm text-[#858697]">{query || params.folder ? "Ничего не найдено по этому запросу." : "Заметок пока нет. Создайте первую выше."}</div>}</div>
      </div>
    </div>
  </ModuleShell>;
}
