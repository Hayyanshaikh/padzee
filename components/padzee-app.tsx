'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import LinkExtension from '@tiptap/extension-link'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import { AlignCenter, AlignLeft, AlignRight, Bold, Check, ChevronDown, Code2, Copy, FilePlus2, Highlighter, Italic, Link2, List, ListOrdered, LoaderCircle, Menu, Moon, MoreHorizontal, Pencil, Quote, Redo2, RotateCcw, Search, Settings2, Share2, Sparkles, Strikethrough, Sun, Trash2, Underline as UnderlineIcon, X } from 'lucide-react'

type Note = { id: string; createdAt?: string; title: string; content: string; slug: string; legacySlugs?: string[]; lockMode: 'editor' | 'viewer'; ownerToken?: string; isDraft?: boolean }
const API = 'https://6781237b85151f714b098b06.mockapi.io/api/v1/public-notes'
const OWNER_TOKEN_KEY = 'padzee-owner-token'

function getOwnerToken() {
  const existing = window.localStorage.getItem(OWNER_TOKEN_KEY)
  if (existing) return existing
  const token = typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : Array.from(window.crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, '0')).join('')
  window.localStorage.setItem(OWNER_TOKEN_KEY, token)
  return token
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  return response.json() as Promise<T>
}
function hasMeaningfulContent(content?: string | null) {
  if (!content) return false
  const text = content.replace(/<br\s*\/?\s*>/gi, '').replace(/&nbsp;|&#160;|&#xA0;/gi, ' ').replace(/<[^>]*>/g, '').trim()
  return Boolean(text) || /<(?:hr|img|iframe|audio|video|table)\b/i.test(content)
}
function slugify(title: string) {
  return title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'untitled-note'
}
function uniqueSlug(title: string, reserved: Set<string>, currentSlug?: string) {
  const base = slugify(title)
  if ((!reserved.has(base) || base === currentSlug) && base !== currentSlug) return base
  if (base === currentSlug) return base
  let suffix = 2
  while (reserved.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}
function dateLabel(date?: string) { return date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Just now' }

function Padzee() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [notes, setNotes] = useState<Note[]>([])
  const [ownerToken, setOwnerToken] = useState<string | null>(null)
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sharePreparing, setSharePreparing] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [title, setTitle] = useState('')
  const [dark, setDark] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuOpensUp, setMenuOpensUp] = useState(false)
  const [menuBusyId, setMenuBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [renameTarget, setRenameTarget] = useState<Note | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const menuRef = useRef<HTMLDivElement | null>(null)
  const currentNote = useRef<Note | null>(null)
  const persistedSlug = useRef('')
  const reservedSlugs = useRef(new Set<string>())
  const draftSaveInFlight = useRef(false)
  const pendingDraftSave = useRef<{ draftId: string; id: string; payload: Omit<Note, 'id' | 'createdAt' | 'isDraft'> } | null>(null)
  const titleRef = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editVersion = useRef(0)
  const savedVersion = useRef(0)
  const editorSyncing = useRef(false)
  const editorSyncVersion = useRef(0)
  const pendingSaveCount = useRef(0)
  const saveQueue = useRef<Promise<void>>(Promise.resolve())
  const isViewer = note?.lockMode === 'viewer'
  const isReadOnly = isViewer || sharePreparing || Boolean(note?.isDraft && saving)

  const extensions = useMemo(() => [StarterKit.configure({ link: false, underline: false }), Underline, TextStyle, Color, Highlight.configure({ multicolor: true }), LinkExtension.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }), TextAlign.configure({ types: ['heading', 'paragraph'] })], [])
  const editor = useEditor({ extensions, content: '', editable: false, immediatelyRender: false, editorProps: { attributes: { class: 'padzee-prose focus:outline-none', 'aria-label': 'Note content', spellcheck: 'true' } }, onUpdate: ({ editor: instance }) => {
    const active = currentNote.current
    if (!active || active.lockMode === 'viewer' || editorSyncing.current) return
    const content = instance.getHTML()
    if (!hasMeaningfulContent(content) && hasMeaningfulContent(active.content)) return
    editVersion.current += 1
    currentNote.current = { ...active, content }
    setNote(prev => prev ? { ...prev, content } : prev)
    if (!active.isDraft) scheduleSave()
  } })

  const showToast = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }, [])
  const updateCurrent = useCallback((next: Note | null, nextTitle = '') => {
    if (currentNote.current?.id !== next?.id) {
      if (timer.current) clearTimeout(timer.current)
      editVersion.current = 0
      savedVersion.current = 0
      setSaving(false)
    }
    currentNote.current = next
    persistedSlug.current = next?.slug || ''
    titleRef.current = nextTitle
    setNote(next)
    setTitle(nextTitle)
    if (editor) {
      editor.setEditable(Boolean(next && next.lockMode !== 'viewer'))
      const content = next?.content || ''
      if (editor.getHTML() !== content) {
        const syncVersion = ++editorSyncVersion.current
        editorSyncing.current = true
        editor.commands.setContent(content, { emitUpdate: false })
        window.requestAnimationFrame(() => { if (editorSyncVersion.current === syncVersion) editorSyncing.current = false })
      }
    }
  }, [editor])

  const discardDraft = useCallback(() => {
    const draft = currentNote.current
    if (!draft?.isDraft) return true
    if (draftSaveInFlight.current) return false
    if (!window.confirm('Discard this unsaved note? Your changes will be lost.')) return false
    if (timer.current) clearTimeout(timer.current)
    const pending = pendingDraftSave.current
    pendingDraftSave.current = null
    if (pending?.draftId === draft.id) void request(`${API}/${pending.id}`, { method: 'DELETE' }).catch(() => undefined)
    updateCurrent(null, '')
    setSavedAt(null)
    setSaveError('')
    return true
  }, [updateCurrent])

  const guardDraftNavigation = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (currentNote.current?.isDraft && !discardDraft()) event.preventDefault()
  }, [discardDraft])

  const saveSnapshot = useCallback((id: string): Promise<boolean> => {
    const active = currentNote.current
    if (!active || active.id !== id || active.isDraft) return Promise.resolve(false)
    if (editVersion.current <= savedVersion.current) return Promise.resolve(true)
    pendingSaveCount.current += 1
    setSaving(true)
    setSaveError('')

    const write = saveQueue.current.then(async () => {
      const live = currentNote.current
      if (!live || live.id !== id || live.isDraft) return false
      const version = editVersion.current
      if (version <= savedVersion.current) return true
      if (editorSyncing.current) await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()))
      if (editorSyncing.current) return false
      const content = editor ? editor.getHTML() : live.content
      if (!hasMeaningfulContent(content)) {
        if (currentNote.current?.id === id) setSaveError('Your empty changes were not saved. Add content and try again.')
        return false
      }
      const nextTitle = titleRef.current.trim() || 'Untitled Note'
      const slug = live.slug
      const lockMode = live.lockMode
      const legacySlugs = Array.from(new Set([...(live.legacySlugs || []), ...(persistedSlug.current && persistedSlug.current !== slug ? [persistedSlug.current] : [])]))
      try {
        const updated = await request<Partial<Note>>(`${API}/${id}`, { method: 'PUT', body: JSON.stringify({ title: nextTitle, content, slug, legacySlugs, lockMode, ownerToken: live.ownerToken }) })
        const confirmed = updated.title === nextTitle && updated.content === content ? updated : await request<Partial<Note>>(`${API}/${id}`)
        if (confirmed.title !== nextTitle || confirmed.content !== content) throw new Error('The latest note content was not confirmed.')
        reservedSlugs.current.add(slug)
        legacySlugs.forEach(oldSlug => reservedSlugs.current.add(oldSlug))
        if (currentNote.current?.id === id) {
          persistedSlug.current = slug
          savedVersion.current = Math.max(savedVersion.current, version)
          setSavedAt(new Date())
          setSaveError('')
          const saved: Note = { ...live, ...updated, id, title: nextTitle, content, slug, legacySlugs, lockMode, ownerToken: live.ownerToken, isDraft: false }
          if (editVersion.current === version) {
            currentNote.current = saved
            setNote(saved)
            setTitle(nextTitle)
          }
          const latest = currentNote.current
          setNotes(existing => existing.map(item => item.id === id ? {
            ...saved,
            ...(latest?.id === id && editVersion.current !== version ? { title: latest.title, content: latest.content, slug: latest.slug, lockMode: latest.lockMode } : {}),
          } : item))
          return editVersion.current <= savedVersion.current
        }
        return false
      } catch {
        if (currentNote.current?.id === id) setSaveError('Could not save. Your changes are still here.')
        return false
      }
    })
    saveQueue.current = write.then(() => undefined, () => undefined)
    return write.finally(() => {
      pendingSaveCount.current = Math.max(0, pendingSaveCount.current - 1)
      if (currentNote.current?.id === id) setSaving(pendingSaveCount.current > 0)
    })
  }, [editor])

  const scheduleSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    const active = currentNote.current
    if (!active || active.isDraft || active.lockMode === 'viewer' || editVersion.current <= savedVersion.current) return
    timer.current = setTimeout(() => { void saveSnapshot(active.id) }, 750)
  }, [saveSnapshot])

  useEffect(() => {
    try {
      setOwnerToken(getOwnerToken())
    } catch {
      setSaveError('Could not access this browser’s local storage. Enable it to keep your notes private to this browser.')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!ownerToken) return
    let cancelled = false
    if (!slug && currentNote.current?.isDraft) { setLoading(false); return () => { cancelled = true } }
    setLoading(true); setSaveError('')
    const versionAtLoad = editVersion.current
    const loadNotes = async () => {
      const [data, matchingSlug] = await Promise.all([
        request<Note[]>(API),
        slug ? request<Note[]>(`${API}?slug=${encodeURIComponent(slug)}`) : Promise.resolve([] as Note[]),
      ])
      if (cancelled) return
      reservedSlugs.current = new Set(data.flatMap(item => [item.slug, ...(item.legacySlugs || [])]))
      const activeBeforeLoad = currentNote.current
      setNotes(data.filter(item => item.ownerToken === ownerToken).map(item => {
        if (activeBeforeLoad?.id === item.id && !hasMeaningfulContent(item.content) && hasMeaningfulContent(activeBeforeLoad.content)) return { ...item, content: activeBeforeLoad.content }
        return item
      }))
      if (!slug) {
        updateCurrent(null, '')
        setSavedAt(null)
        return
      }
      const directMatch = matchingSlug.find(item => item.slug === slug)
      const aliasMatch = data.find(item => item.slug === slug || item.legacySlugs?.includes(slug))
      const found = directMatch || aliasMatch
      if (!found) {
        updateCurrent(null, '')
        setSavedAt(null)
        return
      }
      const listedMatch = data.find(item => item.id === found.id)
      const remoteContent = hasMeaningfulContent(found.content) ? found.content : listedMatch?.content || found.content || ''
      const preserveLocal = activeBeforeLoad?.id === found.id && (
        editVersion.current !== versionAtLoad || (!hasMeaningfulContent(remoteContent) && hasMeaningfulContent(activeBeforeLoad.content))
      )
      const resolved: Note = {
        ...found,
        title: preserveLocal ? activeBeforeLoad.title : found.title || listedMatch?.title || 'Untitled Note',
        content: preserveLocal ? activeBeforeLoad.content : remoteContent,
        slug: preserveLocal ? activeBeforeLoad.slug : found.slug,
        lockMode: preserveLocal ? activeBeforeLoad.lockMode : found.lockMode,
        legacySlugs: preserveLocal ? activeBeforeLoad.legacySlugs : found.legacySlugs,
        ownerToken: found.ownerToken || activeBeforeLoad?.ownerToken,
        isDraft: false,
      }
      updateCurrent(resolved, resolved.title)
      savedVersion.current = preserveLocal ? versionAtLoad : editVersion.current
      setSavedAt(new Date(found.createdAt || Date.now()))
    }
    loadNotes().catch(() => {
      if (!cancelled) {
        if (slug && currentNote.current?.slug !== slug) updateCurrent(null, '')
        setSaveError('We couldn’t load your notes. Check your connection and try again.')
      }
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; if (timer.current) clearTimeout(timer.current) }
  }, [slug, ownerToken, updateCurrent])

  useEffect(() => { if (editor && note) { editor.setEditable(!isReadOnly); const content = note.content || ''; if (editor.getHTML() !== content) { const syncVersion = ++editorSyncVersion.current; editorSyncing.current = true; editor.commands.setContent(content, { emitUpdate: false }); window.requestAnimationFrame(() => { if (editorSyncVersion.current === syncVersion) editorSyncing.current = false }) } } }, [editor, note?.id, note?.lockMode, note?.isDraft, isReadOnly])
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); document.documentElement.classList.toggle('light', !dark) }, [dark])
  useEffect(() => { if (note && !note.isDraft && note.lockMode !== 'viewer') scheduleSave() }, [title])
  useEffect(() => {
    if (!note?.isDraft) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    const confirmHistoryNavigation = () => {
      if (!draftSaveInFlight.current && window.confirm('Discard this unsaved note? Your changes will be lost.')) { discardDraft(); return }
      navigate('/', { state: { padzeeDraft: true } })
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    window.addEventListener('popstate', confirmHistoryNavigation)
    return () => {
      window.removeEventListener('beforeunload', warnBeforeLeaving)
      window.removeEventListener('popstate', confirmHistoryNavigation)
    }
  }, [note?.isDraft, note?.slug, discardDraft, navigate])

  const createNote = useCallback(() => {
    setMobileSidebarOpen(false)
    if (saving || sharePreparing || draftSaveInFlight.current) return
    if (currentNote.current?.isDraft && !discardDraft()) return
    if (!ownerToken) { setSaveError('Could not create a note before your browser identity is ready. Please try again.'); return }
    setSaveError('')
    const draft: Note = {
      id: `draft-${typeof window.crypto?.randomUUID === 'function' ? window.crypto.randomUUID() : Date.now()}`,
      title: 'Untitled Note', content: '', slug: '',
      legacySlugs: [], lockMode: 'editor', ownerToken, isDraft: true,
    }
    updateCurrent(draft, draft.title)
    setSavedAt(null)
    setShareOpen(false)
    if (window.location.pathname !== '/') navigate('/', { replace: true })
    navigate('/', { state: { padzeeDraft: true } })
  }, [saving, ownerToken, updateCurrent, navigate, discardDraft])

  const saveDraft = useCallback(async () => {
    const draft = currentNote.current
    if (!draft?.isDraft || !ownerToken || draftSaveInFlight.current) return
    draftSaveInFlight.current = true
    if (timer.current) clearTimeout(timer.current)
    setSaving(true)
    setSaveError('')
    const saveVersion = editVersion.current
    const nextTitle = titleRef.current.trim() || 'Untitled Note'
    const previousAttempt = pendingDraftSave.current?.draftId === draft.id ? pendingDraftSave.current : null
    const reserved = new Set(reservedSlugs.current)
    if (previousAttempt) reserved.delete(previousAttempt.payload.slug)
    const slug = previousAttempt?.payload.title === nextTitle ? previousAttempt.payload.slug : uniqueSlug(nextTitle, reserved)
    const payload = {
      title: nextTitle,
      content: editor ? editor.getHTML() : draft.content,
      slug,
      legacySlugs: [],
      lockMode: draft.lockMode,
      ownerToken,
    }
    try {
      let id = previousAttempt?.id
      if (id && previousAttempt && JSON.stringify(previousAttempt.payload) !== JSON.stringify(payload)) {
        await request<Partial<Note>>(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
        pendingDraftSave.current = { ...previousAttempt, payload }
      }
      if (!id) {
        const created = await request<Partial<Note>>(API, { method: 'POST', body: JSON.stringify(payload) })
        if (created.id === undefined || created.id === null || String(created.id).length === 0) throw new Error('The note service did not return an ID.')
        id = String(created.id)
        pendingDraftSave.current = { draftId: draft.id, id, payload }
      }
      reservedSlugs.current.add(slug)
      const verified = await request<Partial<Note>>(`${API}/${id}`)
      if (verified.title !== payload.title || verified.content !== payload.content || verified.slug !== payload.slug) {
        throw new Error('The note service did not confirm the complete note content.')
      }
      const saved: Note = { ...verified, ...payload, id, ownerToken: verified.ownerToken || ownerToken, isDraft: false }
      pendingDraftSave.current = null
      reservedSlugs.current.add(saved.slug)
      setNotes(existing => [saved, ...existing.filter(item => item.id !== saved.id)])
      if (currentNote.current?.id === draft.id) {
        currentNote.current = saved
        persistedSlug.current = saved.slug
        savedVersion.current = saveVersion
        setNote(saved)
        setTitle(saved.title)
        setSavedAt(new Date())
        setSaving(false)
        navigate(`/note/${saved.slug}`, { replace: true })
      }
    } catch {
      if (currentNote.current?.id === draft.id) setSaveError('Could not confirm that the complete note was saved. Your changes are still here; please retry.')
    } finally {
      draftSaveInFlight.current = false
      if (currentNote.current?.id === draft.id) setSaving(false)
    }
  }, [editor, ownerToken, navigate])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); void createNote() }
      if (event.key.toLowerCase() === 'k') { event.preventDefault(); document.querySelector<HTMLInputElement>('[aria-label="Search notes"]')?.focus() }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [createNote])

  const deleteNote = async () => {
    if (!note) return
    if (note.isDraft) { if (discardDraft()) navigate('/'); return }
    if (!window.confirm('Delete this note? This cannot be undone.')) return
    const deleted = note
    try {
      await request(`${API}/${note.id}`, { method: 'DELETE' })
      setNotes(prev => prev.filter(item => item.id !== deleted.id)); updateCurrent(null, ''); navigate('/'); showToast('Note deleted')
    } catch { setSaveError('Could not delete this note. Please try again.') }
  }

  useEffect(() => {
    if (!openMenuId) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpenMenuId(null)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuId(null)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [openMenuId])

  const openRename = (item: Note) => {
    setOpenMenuId(null)
    setActionError('')
    setRenameTarget(item)
    setRenameDraft(item.title || '')
  }

  const saveRename = async () => {
    if (!renameTarget || !ownerToken) return
    const target = renameTarget
    const latestNote = currentNote.current?.id === target.id ? currentNote.current : target
    const previousTitle = latestNote.title
    const nextTitle = renameDraft.trim() || 'Untitled Note'
    const reservedForRename = new Set(reservedSlugs.current)
    reservedForRename.delete(target.slug)
    target.legacySlugs?.forEach(oldSlug => reservedForRename.delete(oldSlug))
    const nextSlug = uniqueSlug(nextTitle, reservedForRename)
    const legacySlugs = Array.from(new Set([...(target.legacySlugs || []), ...(target.slug !== nextSlug ? [target.slug] : [])]))
    setMenuBusyId(target.id)
    setActionError('')
    setNotes(existing => existing.map(item => item.id === target.id ? { ...item, title: nextTitle, slug: nextSlug, legacySlugs } : item))
    if (currentNote.current?.id === target.id) {
      const updatedCurrent = { ...currentNote.current, title: nextTitle, slug: nextSlug, legacySlugs }
      currentNote.current = updatedCurrent
      titleRef.current = nextTitle
      setNote(updatedCurrent)
      setTitle(nextTitle)
    }
    try {
      const write = saveQueue.current.then(async () => {
        const live = currentNote.current?.id === target.id ? currentNote.current : latestNote
        const content = currentNote.current?.id === target.id && editor ? editor.getHTML() : live.content
        if (!hasMeaningfulContent(content)) throw new Error('Refusing to overwrite note content with an empty value.')
        const version = editVersion.current
        const response = await request<Partial<Note>>(`${API}/${target.id}`, { method: 'PUT', body: JSON.stringify({ title: nextTitle, content, slug: nextSlug, legacySlugs, lockMode: live.lockMode, ownerToken: live.ownerToken || ownerToken }) })
        const updated = response.title === nextTitle && response.content === content ? response : await request<Partial<Note>>(`${API}/${target.id}`)
        if (updated.title !== nextTitle || updated.content !== content || updated.slug !== nextSlug) throw new Error('The renamed note was not confirmed.')
        return { saved: { ...live, ...updated, id: target.id, title: nextTitle, content, slug: nextSlug, legacySlugs, ownerToken: updated.ownerToken || target.ownerToken || ownerToken }, version }
      })
      saveQueue.current = write.then(() => undefined, () => undefined)
      const { saved, version } = await write
      reservedSlugs.current.add(nextSlug)
      legacySlugs.forEach(oldSlug => reservedSlugs.current.add(oldSlug))
      if (currentNote.current?.id === target.id) {
        persistedSlug.current = nextSlug
        savedVersion.current = Math.max(savedVersion.current, version)
        if (editVersion.current === version) {
          currentNote.current = saved
          setNote(saved)
          titleRef.current = nextTitle
          setTitle(nextTitle)
        } else {
          currentNote.current = { ...currentNote.current, title: nextTitle, slug: nextSlug, legacySlugs }
        }
        setSavedAt(new Date())
        navigate(`/note/${nextSlug}`, { replace: true })
      }
      setNotes(existing => existing.map(item => item.id === target.id ? saved : item))
      setRenameTarget(null)
    } catch {
      setNotes(existing => existing.map(item => item.id === target.id ? { ...item, title: previousTitle, slug: target.slug, legacySlugs: target.legacySlugs } : item))
      if (currentNote.current?.id === target.id) {
        const restored = { ...currentNote.current, title: previousTitle, slug: target.slug, legacySlugs: target.legacySlugs }
        currentNote.current = restored
        titleRef.current = previousTitle
        setNote(restored)
        setTitle(previousTitle)
      }
      setActionError('Could not rename this note. Please try again.')
    } finally {
      setMenuBusyId(null)
    }
  }

  const ensureSavedBeforeShare = useCallback(async (id: string) => {
    const active = currentNote.current
    if (!active || active.id !== id || active.isDraft) return false
    if (timer.current) clearTimeout(timer.current)
    setSharePreparing(true)
    try {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const saved = await saveSnapshot(id)
        if (!saved || currentNote.current?.id !== id) return false
        if (editVersion.current <= savedVersion.current) return true
      }
      setSaveError('Your latest changes could not be saved. Please try sharing again.')
      return false
    } finally {
      setSharePreparing(false)
    }
  }, [saveSnapshot])

  const copyNoteLink = async (item: Note) => {
    setMenuBusyId(item.id)
    setActionError('')
    try {
      const isCurrent = currentNote.current?.id === item.id
      if (isCurrent && !await ensureSavedBeforeShare(item.id)) throw new Error('Save failed')
      const remote = await request<Note>(`${API}/${item.id}`)
      const current = isCurrent ? currentNote.current : null
      const expected = current?.content || item.content
      if (hasMeaningfulContent(expected) && (!hasMeaningfulContent(remote.content) || remote.content !== expected)) throw new Error('Latest note content could not be confirmed')
      const latest = current || { ...item, ...remote, content: hasMeaningfulContent(remote.content) ? remote.content : item.content }
      await navigator.clipboard.writeText(`${window.location.origin}/note/${latest.slug}`)
      setOpenMenuId(null)
      showToast('Link copied')
    } catch {
      setActionError('Could not save the latest note changes or copy the link. Please try again.')
    } finally {
      setMenuBusyId(null)
    }
  }

  const duplicateNote = async (item: Note) => {
    if (!ownerToken) { setActionError('Your browser identity is not ready. Please try again.'); return }
    setMenuBusyId(item.id)
    setActionError('')
    const duplicate = { title: `${item.title || 'Untitled Note'} copy`, content: item.content, slug: uniqueSlug(`${item.title || 'Untitled Note'} copy`, reservedSlugs.current), legacySlugs: [] as string[], lockMode: item.lockMode, ownerToken }
    try {
      const created = await request<Note>(API, { method: 'POST', body: JSON.stringify(duplicate) })
      reservedSlugs.current.add(created.slug)
      setNotes(existing => [{ ...created, ownerToken: created.ownerToken || ownerToken }, ...existing])
      setOpenMenuId(null)
      showToast('Note duplicated')
    } catch {
      setActionError('Could not duplicate this note. Please try again.')
    } finally {
      setMenuBusyId(null)
    }
  }

  const deleteSidebarNote = async (item: Note) => {
    setOpenMenuId(null)
    if (!window.confirm(`Delete “${item.title || 'Untitled Note'}”? This cannot be undone.`)) return
    setMenuBusyId(item.id)
    setActionError('')
    try {
      await request(`${API}/${item.id}`, { method: 'DELETE' })
      setNotes(existing => existing.filter(noteItem => noteItem.id !== item.id))
      if (currentNote.current?.id === item.id) {
        updateCurrent(null, '')
        navigate('/')
      }
      showToast('Note deleted')
    } catch {
      setActionError('Could not delete this note. Please try again.')
    } finally {
      setMenuBusyId(null)
    }
  }

  const changePermission = (value: Note['lockMode']) => {
    if (!note) return
    const next = { ...note, lockMode: value }
    currentNote.current = next; setNote(next)
    if (editor) editor.setEditable(value === 'editor' && !saving && !sharePreparing)
    editVersion.current += 1
    if (!note.isDraft) void saveSnapshot(note.id)
  }

  const copyLink = async () => {
    const active = currentNote.current
    if (!active || active.isDraft || !await ensureSavedBeforeShare(active.id)) {
      if (active && !active.isDraft && !saveError) setSaveError('Save the latest changes before sharing this note.')
      return
    }
    const latest = currentNote.current
    if (!latest || latest.id !== active.id) return
    const link = `${window.location.origin}/note/${latest.slug}`
    try { await navigator.clipboard.writeText(link); showToast('Link copied') }
    catch { setShareOpen(true); setLinkInput(link); showToast('Select and copy the link') }
  }

  const filtered = notes.filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
  const isDirty = Boolean(note && !note.isDraft && note.lockMode !== 'viewer' && editVersion.current > savedVersion.current)
  const words = (editor?.getText() || '').trim().split(/\s+/).filter(Boolean).length
  const chars = (editor?.getText() || '').length

  if (loading) return <main className="app-loading"><div className="loading-mark"><span /></div><p>Opening your notebook…</p></main>
  if (slug && !note) return <main className="not-found"><div className="brand-mark"><span /></div><p className="eyebrow">PADZEE / NOTE NOT FOUND</p><h1>This page is a blank.</h1><p>The note may have been deleted, or the link may be incorrect.</p><Link className="primary-button" to="/">Back to Padzee</Link></main>

  return <div className="app-shell">
    {mobileSidebarOpen && <button type="button" className="sidebar-backdrop" aria-label="Close sidebar" onClick={() => setMobileSidebarOpen(false)} />}
    <aside className={`sidebar ${mobileSidebarOpen ? 'is-open' : ''}`}>
      <div className="sidebar-brand"><Link to="/" className="brand-lockup" onClick={event => { guardDraftNavigation(event); if (!event.defaultPrevented) setMobileSidebarOpen(false) }}><span className="brand-mark"><span /></span><span>padzee<span className="brand-period">.</span></span></Link><button type="button" className="icon-button sidebar-collapse" aria-label="Close sidebar" onClick={() => setMobileSidebarOpen(false)}><X /></button></div>
      <button className="new-note-button" onClick={createNote} disabled={saving || sharePreparing}><FilePlus2 size={17} /> New note <span className="shortcut">⌘ N</span></button>
      <div className="sidebar-section"><div className="section-heading"><span>YOUR NOTES</span><span className="note-count">{notes.length}</span></div><label className="search-box"><Search size={15} /><input aria-label="Search notes" placeholder="Search notes" value={query} onChange={e => setQuery(e.target.value)} /><kbd>⌘ K</kbd></label>
        {actionError && <p className="sidebar-action-error" role="alert">{actionError}</p>}
        {menuBusyId && !renameTarget && openMenuId !== menuBusyId && <p className="sidebar-action-progress" role="status"><LoaderCircle size={13} className="spin" /> Updating note…</p>}
        <nav className="note-list" aria-label="Your notes">{filtered.map(item => <div key={item.id} className="note-row" ref={openMenuId === item.id ? menuRef : null}><Link to={`/note/${item.slug}`} onClick={event => { guardDraftNavigation(event); if (!event.defaultPrevented) setOpenMenuId(null) }} className={`note-list-item ${item.slug === slug ? 'active' : ''}`}><span className="note-list-icon"><span /></span><span className="note-list-copy"><span className="note-list-title">{item.title || 'Untitled Note'}</span><span className="note-list-date">{dateLabel(item.createdAt)}</span></span></Link><button type="button" className="note-more" aria-label={`Options for ${item.title || 'Untitled Note'}`} aria-haspopup="menu" aria-expanded={openMenuId === item.id} aria-controls={`note-menu-${item.id}`} disabled={menuBusyId === item.id} onClick={event => { setActionError(''); setMenuOpensUp(window.innerHeight - event.currentTarget.getBoundingClientRect().bottom < 190); setOpenMenuId(openMenuId === item.id ? null : item.id) }}><MoreHorizontal size={16} /></button>{openMenuId === item.id && <div className={`note-menu ${menuOpensUp ? 'opens-up' : ''}`}  id={`note-menu-${item.id}`} role="menu" aria-label={`Actions for ${item.title || 'Untitled Note'}`}><button type="button" role="menuitem" disabled={menuBusyId === item.id} onClick={() => openRename(item)}><Pencil size={14} />Rename</button><button type="button" role="menuitem" disabled={menuBusyId === item.id} onClick={() => void copyNoteLink(item)}><Copy size={14} />Copy Link</button><button type="button" role="menuitem" disabled={menuBusyId === item.id} onClick={() => void duplicateNote(item)}><FilePlus2 size={14} />Duplicate</button><button type="button" role="menuitem" className="danger-action" disabled={menuBusyId === item.id} onClick={() => void deleteSidebarNote(item)}><Trash2 size={14} />Delete</button>{menuBusyId === item.id && <span className="menu-progress" role="status"><LoaderCircle size={13} className="spin" />Working…</span>}</div>}</div>)}{filtered.length === 0 && <p className="sidebar-empty">{query ? 'No notes match your search.' : 'Your notes will appear here.'}</p>}</nav>
      </div>
      <div className="sidebar-bottom"><div className="storage-card"><div className="storage-icon"><Sparkles size={16} /></div><div><strong>A little space to think.</strong><p>Your notes, just as you left them.</p></div></div><div className="profile-row"><span className="avatar">P</span><span className="profile-info"><strong>My workspace</strong><small>Personal space</small></span><Settings2 size={16} aria-hidden="true" /></div></div>
    </aside>
    <main className="workspace">
      <header className="topbar"><div className="breadcrumbs"><button type="button" className="mobile-sidebar-toggle" aria-label="Open notes sidebar" aria-expanded={mobileSidebarOpen} onClick={() => setMobileSidebarOpen(true)}><Menu size={18} /></button><Link to="/" onClick={event => { guardDraftNavigation(event); if (!event.defaultPrevented) setMobileSidebarOpen(false) }}>My notes</Link><span className="crumb-slash">/</span><span className="crumb-current">{note ? (title || 'Untitled Note') : 'Your notebook'}</span></div><div className="top-actions"><div className={`save-status ${saving ? 'is-saving' : ''} ${saveError ? 'has-error' : ''}`} aria-live="polite">{saving ? <LoaderCircle size={14} className="spin" /> : saveError ? <span className="status-dot error-dot" /> : note?.isDraft || isDirty ? <span className="status-dot" /> : <Check size={14} />}<span>{saving ? 'Saving' : saveError ? 'Not saved' : note?.isDraft ? 'Unsaved draft' : isDirty ? 'Unsaved changes' : savedAt ? 'Saved' : 'All changes saved'}</span></div><span className="top-divider" />{note?.isDraft && <button className="save-note-button" onClick={() => void saveDraft()} disabled={saving || !ownerToken}>{saving ? 'Saving…' : 'Save'}</button>}<button className="icon-button theme-button" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button>{note && <>{!note.isDraft && <button className="share-button" onClick={copyLink} disabled={saving || sharePreparing}><Share2 size={15} /><span>Share</span></button>}<button className="icon-button delete-button" aria-label="Delete note" onClick={deleteNote}><Trash2 /></button></>}</div></header>
      {saveError && <div className="error-banner" role="alert"><span>{saveError}</span><button onClick={() => { setSaveError(''); if (note?.isDraft) void saveDraft(); else if (note) void saveSnapshot(note.id) }}>Retry</button></div>}
      {note ? <>
        <div className="editor-toolbar"><div className="toolbar-group format-select"><select aria-label="Text style" disabled={isReadOnly} value={editor?.isActive('heading', { level: 1 }) ? 'h1' : editor?.isActive('heading', { level: 2 }) ? 'h2' : editor?.isActive('heading', { level: 3 }) ? 'h3' : 'p'} onChange={e => { const value = e.target.value; if (value === 'p') editor?.chain().focus().setParagraph().run(); else editor?.chain().focus().toggleHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 }).run() }}><option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select><ChevronDown size={13} /></div><span className="toolbar-divider" /><div className="toolbar-group">{[[Bold, 'Bold', 'bold'], [Italic, 'Italic', 'italic'], [UnderlineIcon, 'Underline', 'underline'], [Strikethrough, 'Strikethrough', 'strike']].map(([Icon, label, key]: any) => <button key={key} title={label} aria-label={label} disabled={isReadOnly} className={`toolbar-button ${editor?.isActive(key) ? 'selected' : ''}`} onClick={() => { const chain = editor?.chain().focus(); if (key === 'bold') chain?.toggleBold().run(); else if (key === 'italic') chain?.toggleItalic().run(); else if (key === 'underline') chain?.toggleUnderline().run(); else chain?.toggleStrike().run() }}><Icon size={16} /></button>)}</div><span className="toolbar-divider" /><div className="toolbar-group">{[[List, 'Bullet list', 'bullet'], [ListOrdered, 'Numbered list', 'ordered']].map(([Icon, label, key]: any) => <button key={key} title={label} aria-label={label} disabled={isReadOnly} className={`toolbar-button ${editor?.isActive(key === 'bullet' ? 'bulletList' : 'orderedList') ? 'selected' : ''}`} onClick={() => editor?.chain().focus()[key === 'bullet' ? 'toggleBulletList' : 'toggleOrderedList']().run()}><Icon size={16} /></button>)}</div><span className="toolbar-divider" /><div className="toolbar-group">{[[AlignLeft, 'Align left', 'left'], [AlignCenter, 'Align center', 'center'], [AlignRight, 'Align right', 'right']].map(([Icon, label, value]: any) => <button key={value} title={label} aria-label={label} disabled={isReadOnly} className={`toolbar-button ${editor?.isActive({ textAlign: value }) ? 'selected' : ''}`} onClick={() => editor?.chain().focus().setTextAlign(value).run()}><Icon size={16} /></button>)}</div><span className="toolbar-divider" /><div className="toolbar-group"><label className="color-control" title="Text color"><span>A</span><input aria-label="Text color" type="color" defaultValue="#475569" disabled={isReadOnly} onChange={e => editor?.chain().focus().setColor(e.target.value).run()} /></label><button title="Highlight text" aria-label="Highlight text" disabled={isReadOnly} className={`toolbar-button ${editor?.isActive('highlight') ? 'selected' : ''}`} onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fff1b8' }).run()}><Highlighter size={16} /></button></div><span className="toolbar-divider" /><div className="toolbar-group">{[[Quote, 'Blockquote', 'quote'], [Code2, 'Code block', 'code']].map(([Icon, label, key]: any) => <button key={key} title={label} aria-label={label} disabled={isReadOnly} className={`toolbar-button ${editor?.isActive(key === 'quote' ? 'blockquote' : 'codeBlock') ? 'selected' : ''}`} onClick={() => editor?.chain().focus()[key === 'quote' ? 'toggleBlockquote' : 'toggleCodeBlock']().run()}><Icon size={16} /></button>)}</div><span className="toolbar-divider" /><div className="toolbar-group">{[[Link2, 'Insert link', 'link'], [RotateCcw, 'Undo', 'undo'], [Redo2, 'Redo', 'redo']].map(([Icon, label, key]: any) => <button key={key} title={label} aria-label={label} disabled={isViewer || (key === 'undo' && !editor?.can().undo()) || (key === 'redo' && !editor?.can().redo())} className="toolbar-button" onClick={() => { if (key === 'undo') editor?.chain().focus().undo().run(); else if (key === 'redo') editor?.chain().focus().redo().run(); else { const previous = editor?.getAttributes('link').href || ''; const href = window.prompt('Enter a URL', previous); if (href) editor?.chain().focus().setLink({ href }).run(); else if (href === '') editor?.chain().focus().unsetLink().run() } }}><Icon size={16} /></button>)}</div><button className="clear-format" disabled={isReadOnly} onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}>Clear formatting</button><div className="toolbar-spacer" /><label className="permission-select"><span className="permission-dot" /><select aria-label="Link permission" value={note.lockMode} onChange={e => changePermission(e.target.value as Note['lockMode'])}><option value="editor">Anyone can edit</option><option value="viewer">Anyone can view</option></select><ChevronDown size={13} /></label></div>
        <section className="document-area"><div className="document"><div className="document-meta"><span className="document-icon"><span /></span><span>NOTE</span><span className="meta-dot">·</span><span>Created {dateLabel(note.createdAt)}</span>{isViewer && <span className="view-only-badge">View only</span>}</div><input className="title-input" aria-label="Note title" value={title} onChange={e => { const value = e.target.value; titleRef.current = value; setTitle(value); editVersion.current += 1; if (currentNote.current) { const active = currentNote.current; if (active.isDraft) { const updated = { ...active, title: value }; currentNote.current = updated; setNote(updated) } else { const available = new Set(reservedSlugs.current); available.delete(active.slug); active.legacySlugs?.forEach(oldSlug => available.delete(oldSlug)); const nextSlug = uniqueSlug(value, available); const updated = { ...active, title: value, slug: nextSlug }; currentNote.current = updated; setNote(updated); if (nextSlug !== slug) navigate(`/note/${nextSlug}`, { replace: true }) } } }} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (note.isDraft) void saveDraft(); else scheduleSave() } }} placeholder="Untitled Note" readOnly={isReadOnly} /><div className="title-underline" /><div className="editor-content-wrap">{editor && <EditorContent editor={editor} />}{!isReadOnly && !editor?.getText() && <div className="editor-placeholder" aria-hidden="true">Start writing something wonderful…</div>}</div><div className="document-footer"><span>{words} {words === 1 ? 'word' : 'words'}</span><span className="footer-dot">·</span><span>{chars} characters</span><span className="footer-spacer" /><span>{note.isDraft ? 'Not saved yet' : savedAt ? `Saved ${savedAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : 'Changes save automatically'}</span></div></div></section>
      </> : <section className="welcome-area"><div className="welcome-card"><span className="welcome-spark"><Sparkles size={22} /></span><p className="eyebrow">A QUIET PLACE TO THINK</p><h1>Make room for<br /><em>your thoughts.</em></h1><p className="welcome-copy">A little space to gather your ideas, make sense of things, and share what matters.</p><button className="primary-button" onClick={createNote} disabled={saving || sharePreparing}><FilePlus2 size={17} /> Create your first note</button><span className="welcome-footnote">No sign-up. Just start writing.</span></div><div className="welcome-decoration" aria-hidden="true"><span className="deco-line line-one"/><span className="deco-line line-two"/><span className="deco-line line-three"/><span className="deco-dot dot-one"/><span className="deco-dot dot-two"/></div></section>}
      <footer className="app-footer"><span>Made for the things you don&apos;t want to forget.</span><span>Padzee <span className="brand-period">·</span> Your own little corner</span></footer>
    </main>
    {renameTarget && <div className="modal-backdrop" role="presentation" onClick={event => { if (event.target === event.currentTarget && menuBusyId !== renameTarget.id) setRenameTarget(null) }}><section className="share-modal rename-modal" role="dialog" aria-modal="true" aria-labelledby="rename-title"><button type="button" className="icon-button modal-close" aria-label="Close rename dialog" disabled={menuBusyId === renameTarget.id} onClick={() => setRenameTarget(null)}><X /></button><span className="share-modal-icon"><Pencil size={18} /></span><h2 id="rename-title">Rename note</h2><form onSubmit={event => { event.preventDefault(); void saveRename() }}><label className="rename-label" htmlFor="rename-note-title">Note title</label><input id="rename-note-title" className="rename-input" value={renameDraft} onChange={event => setRenameDraft(event.target.value)} autoFocus maxLength={120} /><div className="rename-actions"><button type="button" className="rename-cancel" disabled={menuBusyId === renameTarget.id} onClick={() => setRenameTarget(null)}>Cancel</button><button type="submit" className="rename-save" disabled={menuBusyId === renameTarget.id}>{menuBusyId === renameTarget.id ? <><LoaderCircle size={14} className="spin" /> Saving…</> : 'Save name'}</button></div></form>{actionError && <p className="rename-error" role="alert">{actionError}</p>}</section></div>}
    {shareOpen && <div className="modal-backdrop" role="presentation" onClick={e => { if (e.target === e.currentTarget) setShareOpen(false) }}><section className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title"><button className="icon-button modal-close" aria-label="Close dialog" onClick={() => setShareOpen(false)}><X /></button><span className="share-modal-icon"><Share2 size={18} /></span><h2 id="share-title">Share this note</h2><p>Anyone with this link can {note?.lockMode === 'editor' ? 'edit' : 'view'} your note.</p><div className="copy-field"><input aria-label="Shareable link" value={linkInput || `${typeof window !== 'undefined' ? window.location.origin : ''}/note/${note?.slug || ''}`} readOnly onFocus={e => e.currentTarget.select()} /><button onClick={async () => { const active = currentNote.current; if (!active || active.isDraft || !await ensureSavedBeforeShare(active.id)) { setSaveError('Save the latest changes before sharing this note.'); return } const latest = currentNote.current; if (!latest || latest.id !== active.id) return; const link = `${window.location.origin}/note/${latest.slug}`; try { await navigator.clipboard.writeText(link); setShareOpen(false); setLinkInput(link); showToast('Link copied') } catch { setLinkInput(link); showToast('Select and copy the link') } }}><Copy size={15} /> Copy</button></div><div className="share-modal-foot"><span className="permission-dot" /> {note?.lockMode === 'editor' ? 'Anyone can edit' : 'Anyone can view'} <button onClick={() => { if (note) changePermission(note.lockMode === 'editor' ? 'viewer' : 'editor') }}>Change</button></div></section></div>}
    {toast && <div className="toast-message" role="status"><Check size={15} />{toast}</div>}
  </div>
}

export default function PadzeeApp() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <main className="app-loading"><div className="loading-mark"><span /></div><p>Opening your notebook…</p></main>
  return <BrowserRouter><Routes><Route path="/" element={<Padzee />} /><Route path="/note/:slug" element={<Padzee />} /><Route path="*" element={<Padzee />} /></Routes></BrowserRouter>
}
