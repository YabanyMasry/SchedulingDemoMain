import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { IconLock, IconLockOpen, IconTrash, IconX, IconArrowRight, IconBolt, IconFilter, IconSearch, IconUsers, IconBooks, IconCrown, IconPencil } from '@tabler/icons-react'
import {
  useTimetableQuery,
  useTimetableGridQuery,
  useAddScheduledLessonMutation,
  useMoveScheduledLessonMutation,
  useRemoveScheduledLessonMutation,
  useSetScheduledLessonLockMutation,
  useAvailableSlotsMutation,
  usePublishTimetableMutation,
  useArchiveTimetableMutation,
  useUnarchiveTimetableMutation,
  useDeleteTimetableMutation,
} from '../api/hooks'
import {
  useMoveLessonMutation,
  useApplySwapChainMutation,
  useStartGenerationMutation,
  useOptimiseTimetableMutation,
} from '../../scheduling/api/hooks'
import { usePeriodsQuery } from '../../resource-management/periods/api/hooks'
import { useRoomsQuery } from '../../resource-management/rooms/api/hooks'
import {
  useLessonsQuery,
  useUpdateLessonMutation,
  useAddLessonTeacherMutation,
  useRemoveLessonTeacherMutation,
  useAddLessonClassMutation,
  useRemoveLessonClassMutation,
  useAddLessonSubjectMutation,
  useRemoveLessonSubjectMutation,
} from '../../resource-management/lessons/api/hooks'
import { useTeachersQuery } from '../../resource-management/teachers/api/hooks'
import { useClassesQuery } from '../../resource-management/classes/api/hooks'
import { useSubjectsQuery } from '../../resource-management/subjects/api/hooks'
import LessonForm from '../../resource-management/lessons/components/LessonForm'
import { paletteFor } from '../lib/grid'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']

const cellKey = (day, periodId) => `${day}|${periodId}`

// Lesson rows come from RM with varying shapes; derive a readable label defensively.
const lessonLabel = (l) => {
  const parts = [l.subjectNames, l.subjects, l.teacherNames, l.teachers]
    .find((x) => Array.isArray(x) && x.length)
  if (parts) return parts.join(', ')
  return `Lesson ${String(l.id).slice(0, 8)}`
}

const TimetableEditorPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: timetable } = useTimetableQuery(id)
  const { data: slots, isLoading, isError } = useTimetableGridQuery(id)
  const { data: periods } = usePeriodsQuery()
  const { data: rooms } = useRoomsQuery()
  const { data: lessons } = useLessonsQuery()
  const { data: teachers } = useTeachersQuery()
  const { data: classes } = useClassesQuery()
  const { data: subjects } = useSubjectsQuery()

  const qc = useQueryClient()
  const add = useAddScheduledLessonMutation(id)
  const move = useMoveScheduledLessonMutation(id)
  const remove = useRemoveScheduledLessonMutation(id)
  const setLock = useSetScheduledLessonLockMutation(id)
  const publish = usePublishTimetableMutation()
  const archive = useArchiveTimetableMutation()
  const unarchive = useUnarchiveTimetableMutation()
  const del = useDeleteTimetableMutation()
  const rcrMove = useMoveLessonMutation()
  const applySwap = useApplySwapChainMutation()

  const [moving, setMoving] = useState(null)
  const [autoResolve, setAutoResolve] = useState(false)
  const [addTarget, setAddTarget] = useState(null)
  const [violation, setViolation] = useState(null)
  const [swapPreview, setSwapPreview] = useState(null)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [details, setDetails] = useState(null)
  const [placement, setPlacement] = useState(null) // { slot, cells: Set("day|periodId"), count }
  const [filters, setFilters] = useState({ teacher: '', subject: '', klass: '', room: '' })
  const [filterMode, setFilterMode] = useState('select') // 'select' | 'search'
  const [filterSearch, setFilterSearch] = useState('')
  const [hideFiltered, setHideFiltered] = useState(false)
  const [editLesson, setEditLesson] = useState(null) // LessonDto being edited via LessonForm
  const availableSlots = useAvailableSlotsMutation()
  const updateLesson = useUpdateLessonMutation()
  const addLessonTeacher = useAddLessonTeacherMutation()
  const removeLessonTeacher = useRemoveLessonTeacherMutation()
  const addLessonClass = useAddLessonClassMutation()
  const removeLessonClass = useRemoveLessonClassMutation()
  const addLessonSubject = useAddLessonSubjectMutation()
  const removeLessonSubject = useRemoveLessonSubjectMutation()

  const startGeneration = useStartGenerationMutation()
  const optimiseTimetable = useOptimiseTimetableMutation()

  const sortedPeriods = useMemo(
    () => [...(periods ?? [])].sort((a, b) => (a.periodNumber ?? 0) - (b.periodNumber ?? 0)),
    [periods],
  )

  const slotsByCell = useMemo(() => {
    const map = new Map()
    for (const s of slots ?? []) {
      const k = cellKey(s.dayOfWeek, s.periodId)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(s)
    }
    return map
  }, [slots])

  // Lookups for rendering a swap chain in human terms (period numbers + lesson labels).
  const periodNumberById = useMemo(() => {
    const m = new Map()
    for (const p of sortedPeriods) m.set(p.id, p.periodNumber)
    return m
  }, [sortedPeriods])

  const labelByScheduledLessonId = useMemo(() => {
    const m = new Map()
    for (const s of slots ?? []) m.set(s.scheduledLessonId, s.subjectNames?.join(', ') || 'Lesson')
    return m
  }, [slots])

  const invalidateGrid = () => qc.invalidateQueries({ queryKey: ['timetable-grid', id] })

  const lessonById = useMemo(
    () => new Map((lessons ?? []).map((l) => [l.id, l])),
    [lessons],
  )
  const teacherNameById = useMemo(
    () => new Map((teachers ?? []).map((t) => [
      t.id,
      `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() || t.username || t.id,
    ])),
    [teachers],
  )

  // Distinct names across the grid feed the four filter dropdowns — no extra requests.
  const filterOptions = useMemo(() => {
    const t = new Set(); const su = new Set(); const c = new Set(); const r = new Set()
    for (const s of slots ?? []) {
      s.teacherNames?.forEach((x) => t.add(x))
      s.subjectNames?.forEach((x) => su.add(x))
      s.classNames?.forEach((x) => c.add(x))
      s.roomNames?.forEach((x) => r.add(x))
    }
    const sorted = (set) => [...set].sort((a, b) => a.localeCompare(b))
    return { teachers: sorted(t), subjects: sorted(su), classes: sorted(c), rooms: sorted(r) }
  }, [slots])

  const searchTerm = filterSearch.trim().toLowerCase()
  const hasFilter = filterMode === 'search'
    ? searchTerm.length > 0
    : Boolean(filters.teacher || filters.subject || filters.klass || filters.room)
  const slotMatchesFilters = (s) => {
    if (filterMode === 'search') {
      if (!searchTerm) return true
      return [s.teacherNames, s.subjectNames, s.classNames, s.roomNames]
        .some((names) => (names ?? []).some((n) => n.toLowerCase().includes(searchTerm)))
    }
    return (
      (!filters.teacher || (s.teacherNames ?? []).includes(filters.teacher)) &&
      (!filters.subject || (s.subjectNames ?? []).includes(filters.subject)) &&
      (!filters.klass || (s.classNames ?? []).includes(filters.klass)) &&
      (!filters.room || (s.roomNames ?? []).includes(filters.room))
    )
  }
  const matchCount = hasFilter ? (slots ?? []).filter(slotMatchesFilters).length : (slots ?? []).length
  const clearFilters = () => {
    setFilters({ teacher: '', subject: '', klass: '', room: '' })
    setFilterSearch('')
  }

  // Escape backs out of whatever interaction is in flight, innermost first.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setAddTarget(null)
      setDetails(null)
      setPlacement(null)
      setMoving(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const status = (timetable?.status ?? '').toLowerCase()
  const isDraft = status === 'draft'
  // Draft and Published are both hand-editable; only Archived is read-only. Backend enforces
  // the same rule (Timetable.IsEditable) and re-validates every placement, so editing a
  // published timetable still runs the full hard-constraint engine.
  const isEditable = status !== 'archived' && status !== ''

  // Runs a placement mutation; on a 409 conflict opens the violation override modal.
  const runWithViolationGuard = async (mutateFn, args) => {
    try {
      await mutateFn({ ...args })
    } catch (err) {
      const data = err?.response?.data
      if (err?.response?.status === 409 && Array.isArray(data?.violations)) {
        setViolation({
          violations: data.violations,
          retry: (codes) => mutateFn({ ...args, ignoredConstraints: codes }),
        })
      } else {
        window.alert(data?.error ?? 'Operation failed.')
      }
    }
  }

  // Routes a move through the RCR solver (scheduling /move). A clean slot applies immediately; a
  // conflict with auto-resolve returns a proposed swap chain the admin confirms in a preview modal.
  const runSmartMove = async (target, day, periodId) => {
    try {
      const res = await rcrMove.mutateAsync({
        timetableId: id,
        scheduledLessonId: target.scheduledLessonId,
        targetDay: day,
        targetPeriodId: periodId,
        autoResolve: true,
      })
      if (res?.applied) {
        invalidateGrid()
      } else if (res?.swapChain?.length) {
        setSwapPreview({ moves: res.swapChain })
      } else {
        window.alert('No conflict-free arrangement could be found for this move.')
      }
    } catch (err) {
      window.alert(err?.response?.data?.error ?? 'Move failed.')
    }
  }

  // Re-sends the lesson's core fields with a new lead — the lessons API has no partial update.
  const saveLeadTeacher = async (lesson, leadTeacherId) => {
    try {
      await updateLesson.mutateAsync({
        id: lesson.id,
        duration: lesson.duration,
        frequencyPerWeek: lesson.frequencyPerWeek,
        requiredRoomType: lesson.requiredRoomType ?? null,
        priority: lesson.priority ?? null,
        numberOfStudents: lesson.numberOfStudents ?? null,
        studentGroup: lesson.studentGroup ?? null,
        homeRoom: lesson.homeRoom ?? null,
        specialRequirements: lesson.specialRequirements ?? null,
        leadTeacherId: leadTeacherId || null,
      })
      invalidateGrid()
    } catch (err) {
      window.alert(err?.response?.data?.error ?? 'Could not update the lead teacher.')
    }
  }

  // Same flow as the lessons dashboard: junctions first (the core update validates the
  // lead against the final teacher set), then the core fields. Grid labels may change,
  // so the grid is invalidated alongside the lessons list.
  const handleLessonEditSubmit = async ({ core, teacherIds, classIds, subjectIds }) => {
    const lesson = editLesson
    const diff = (before, after) => ({
      added: after.filter((x) => !before.includes(x)),
      removed: before.filter((x) => !after.includes(x)),
    })
    const t = diff(lesson.teacherIds ?? [], teacherIds)
    const c = diff(lesson.classIds ?? [], classIds)
    const s = diff(lesson.subjectIds ?? [], subjectIds)
    try {
      await Promise.all([
        ...t.added.map((teacherId) => addLessonTeacher.mutateAsync({ lessonId: lesson.id, teacherId })),
        ...t.removed.map((teacherId) => removeLessonTeacher.mutateAsync({ lessonId: lesson.id, teacherId })),
        ...c.added.map((classId) => addLessonClass.mutateAsync({ lessonId: lesson.id, classId })),
        ...c.removed.map((classId) => removeLessonClass.mutateAsync({ lessonId: lesson.id, classId })),
        ...s.added.map((subjectId) => addLessonSubject.mutateAsync({ lessonId: lesson.id, subjectId })),
        ...s.removed.map((subjectId) => removeLessonSubject.mutateAsync({ lessonId: lesson.id, subjectId })),
      ])
      await updateLesson.mutateAsync({ id: lesson.id, ...core })
      setEditLesson(null)
      invalidateGrid()
    } catch (err) {
      window.alert(err?.response?.data?.error ?? 'Lesson update failed.')
    }
  }

  // Computes conflict-free cells for a placed lesson and enters highlight mode:
  // available cells light up green and a click on one executes the move.
  const findSlots = async (slot) => {
    try {
      const res = await availableSlots.mutateAsync(slot.scheduledLessonId)
      if (!res?.length) {
        window.alert('No conflict-free slot exists for this lesson with its current rooms.')
        return
      }
      setDetails(null)
      setPlacement({
        slot,
        cells: new Set(res.map((s) => cellKey(s.dayOfWeek, s.periodId))),
        count: res.length,
      })
    } catch (err) {
      window.alert(err?.response?.data?.error ?? 'Could not compute available slots.')
    }
  }

  const handleCellClick = (day, periodId) => {
    if (placement) {
      if (!placement.cells.has(cellKey(day, periodId))) return
      const target = placement.slot
      setPlacement(null)
      runWithViolationGuard(move.mutateAsync, {
        id: target.scheduledLessonId,
        dayOfWeek: day,
        periodId,
        roomIds: target.roomIds ?? [],
      })
      return
    }
    if (!isEditable) return
    if (moving) {
      const target = moving
      setMoving(null)
      if (autoResolve) {
        runSmartMove(target, day, periodId)
        return
      }
      runWithViolationGuard(move.mutateAsync, {
        id: target.scheduledLessonId,
        dayOfWeek: day,
        periodId,
        roomIds: target.roomIds ?? [],
      })
      return
    }
    setAddTarget({ day, periodId })
  }

  const confirmSwapChain = async () => {
    const moves = swapPreview.moves
    setSwapPreview(null)
    try {
      await applySwap.mutateAsync({ timetableId: id, moves })
      invalidateGrid()
    } catch (err) {
      window.alert(err?.response?.data?.error ?? 'The swap chain could not be applied (it may have gone stale).')
    }
  }

  const handleAddSubmit = async ({ lessonId, roomId }) => {
    await runWithViolationGuard(add.mutateAsync, {
      lessonId,
      dayOfWeek: addTarget.day,
      periodId: addTarget.periodId,
      roomIds: roomId ? [roomId] : [],
    })
    setAddTarget(null)
  }

  const handleDelete = () => {
    if (!window.confirm('Delete this timetable and all its placements? This cannot be undone.')) return
    del.mutate(id, {
      onSuccess: () => navigate('/timetable'),
      onError: (err) => window.alert(err?.response?.data?.error ?? 'Could not delete the timetable.'),
    })
  }

  if (isLoading) return <div className="app-content"><p style={{ padding: 16 }}>Loading…</p></div>
  if (isError) return <div className="app-content"><p style={{ padding: 16, color: 'crimson' }}>Failed to load timetable.</p></div>

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>
              {timetable?.name ?? 'Timetable'}
            </h1>
            <StatusChip status={timetable?.status} />
          </div>
          <p className="card-subtitle">
            {isEditable
              ? 'Click an empty cell to place a lesson · click a placed lesson for details and actions'
              : 'Read-only — click a lesson for details. Archived timetables cannot be edited'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/timetable" className="pill-button" style={ghostBtn}>Back</Link>
          {isDraft && (
            <button type="button" className="pill-button" style={generateBtn}
              onClick={() => setGenerateOpen(true)}>
              <IconBolt size={15} style={{ marginRight: 4 }} /> Generate
            </button>
          )}
          {isDraft && (
            <button type="button" className="pill-button"
              onClick={() => publish.mutate(id)} disabled={publish.isPending}>
              Publish
            </button>
          )}
          {status === 'published' && (
            <button type="button" className="pill-button"
              onClick={() => archive.mutate(id)} disabled={archive.isPending}>
              Archive
            </button>
          )}
          {status === 'archived' && (
            <button type="button" className="pill-button"
              onClick={() => unarchive.mutate(id)} disabled={unarchive.isPending}>
              Unarchive
            </button>
          )}
          <button type="button" className="pill-button" style={dangerBtn}
            onClick={handleDelete} disabled={del.isPending}>
            Delete
          </button>
        </div>
      </div>

      {isEditable && (
        <label style={toggleRow}>
          <input type="checkbox" checked={autoResolve} onChange={(e) => setAutoResolve(e.target.checked)}
            style={{ accentColor: 'var(--brand, #ff8a00)' }} />
          <span>
            <strong style={{ color: 'var(--text-h, #1a1a1a)', fontWeight: 600 }}>Auto-resolve conflicts</strong>
            {' '}— blocked moves propose a swap chain you confirm before it applies
          </span>
        </label>
      )}

      <div style={filterBar}>
        <div style={modeToggle}>
          <button type="button" title="Filter by dropdowns"
            style={{ ...modeBtn, ...(filterMode === 'select' ? modeBtnActive : null) }}
            onClick={() => setFilterMode('select')}>
            <IconFilter size={14} />
          </button>
          <button type="button" title="Filter by search"
            style={{ ...modeBtn, ...(filterMode === 'search' ? modeBtnActive : null) }}
            onClick={() => setFilterMode('search')}>
            <IconSearch size={14} />
          </button>
        </div>
        {filterMode === 'select' ? (
          <>
            <FilterSelect placeholder="All teachers" value={filters.teacher} options={filterOptions.teachers}
              onChange={(v) => setFilters((f) => ({ ...f, teacher: v }))} />
            <FilterSelect placeholder="All subjects" value={filters.subject} options={filterOptions.subjects}
              onChange={(v) => setFilters((f) => ({ ...f, subject: v }))} />
            <FilterSelect placeholder="All classes" value={filters.klass} options={filterOptions.classes}
              onChange={(v) => setFilters((f) => ({ ...f, klass: v }))} />
            <FilterSelect placeholder="All rooms" value={filters.room} options={filterOptions.rooms}
              onChange={(v) => setFilters((f) => ({ ...f, room: v }))} />
          </>
        ) : (
          <input
            style={{ ...filterSelect, flex: 1, maxWidth: 360, ...(searchTerm ? filterSelectActive : null) }}
            placeholder="Search teacher, subject, class or room…"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
        )}
        <label style={hideToggle}>
          <input type="checkbox" checked={hideFiltered} onChange={(e) => setHideFiltered(e.target.checked)}
            style={{ accentColor: 'var(--brand, #ff8a00)' }} />
          Hide non-matching
        </label>
        {hasFilter && (
          <>
            <span style={{ fontSize: 12, color: 'var(--text-soft, #9ca3af)', whiteSpace: 'nowrap' }}>
              {matchCount} of {(slots ?? []).length} shown
            </span>
            <button type="button" style={linkBtn} onClick={clearFilters}>
              Clear
            </button>
          </>
        )}
      </div>

      {moving && (
        <div style={banner}>
          <span style={bannerDot} />
          Moving <strong style={{ margin: '0 4px' }}>{moving.subjectNames?.join(', ') || 'lesson'}</strong>
          — click a target cell to drop it, or{' '}
          <button type="button" onClick={() => setMoving(null)} style={linkBtn}>cancel</button>
        </div>
      )}

      {placement && (
        <div style={{ ...banner, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
          <span style={{ ...bannerDot, background: '#10b981' }} />
          <strong style={{ marginRight: 4 }}>{placement.count}</strong> available slot{placement.count === 1 ? '' : 's'} for
          <strong style={{ margin: '0 4px' }}>{placement.slot.subjectNames?.join(', ') || 'lesson'}</strong>
          — click a highlighted cell to move it there, or{' '}
          <button type="button" onClick={() => setPlacement(null)} style={linkBtn}>cancel</button>
        </div>
      )}

      <div style={gridCard}>
        <div style={gridScroll}>
          <table style={gridTable}>
            <thead>
              <tr>
                <th style={{ ...thCell, ...thCorner, width: 64 }}>Period</th>
                {DAYS.map((d) => <th key={d} style={{ ...thCell, ...thSticky }}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {sortedPeriods.map((p) => (
                <tr key={p.id}>
                  <td style={periodCell}>
                    <span style={periodBadge}>{p.periodNumber ?? '—'}</span>
                  </td>
                  {DAYS.map((day) => {
                    const cellSlots = slotsByCell.get(cellKey(day, p.id)) ?? []
                    const isEmpty = cellSlots.length === 0
                    const isAvailable = placement?.cells.has(cellKey(day, p.id)) ?? false
                    return (
                      <td
                        key={day}
                        style={{ ...gridCell, ...(isAvailable ? availableCell : null) }}
                        className={isEditable && isEmpty && !placement ? 'tt-cell-empty' : undefined}
                        onClick={() => handleCellClick(day, p.id)}
                      >
                        {cellSlots.map((s) => {
                          const matches = !hasFilter || slotMatchesFilters(s)
                          if (!matches && hideFiltered) return null
                          return (
                            <SlotCard
                              key={s.scheduledLessonId}
                              slot={s}
                              editable={isEditable}
                              selected={moving?.scheduledLessonId === s.scheduledLessonId}
                              faded={!matches || (placement && !isAvailable)}
                              inert={Boolean(moving || placement)}
                              onOpenDetails={() => setDetails(s)}
                              onToggleLock={() => setLock.mutate({ id: s.scheduledLessonId, isLocked: !s.isLocked })}
                              onRemove={() => remove.mutate(s.scheduledLessonId)}
                            />
                          )
                        })}
                        {isEditable && isEmpty && !placement && <span className="tt-add-hint" style={addHint}>+</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {sortedPeriods.length === 0 && (
                <tr><td colSpan={DAYS.length + 1} style={{ padding: 20, textAlign: 'center', color: 'var(--text-soft, #9ca3af)' }}>
                  No periods defined. Add periods in Resource Management first.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .tt-cell-empty .tt-add-hint { opacity: 0; transition: opacity .15s; }
        .tt-cell-empty:hover { background: #fff8f0; }
        .tt-cell-empty:hover .tt-add-hint { opacity: 1; }
        .tt-slot-actions { opacity: 0; transition: opacity .15s; }
        .tt-slot:hover .tt-slot-actions { opacity: 1; }
      `}</style>

      {addTarget && (
        <AddLessonModal
          lessons={lessons ?? []}
          rooms={rooms ?? []}
          target={addTarget}
          isSubmitting={add.isPending}
          onClose={() => setAddTarget(null)}
          onSubmit={handleAddSubmit}
        />
      )}

      {details && (
        <SlotDetailsModal
          slot={details}
          lesson={lessonById.get(details.lessonId)}
          teacherNameById={teacherNameById}
          rooms={rooms ?? []}
          editable={isEditable}
          findPending={availableSlots.isPending}
          lockPending={setLock.isPending}
          leadPending={updateLesson.isPending}
          onSetLead={(lesson, leadId) => saveLeadTeacher(lesson, leadId)}
          onEditLesson={(lesson) => { setDetails(null); setEditLesson(lesson) }}
          onClose={() => setDetails(null)}
          onMove={() => { setMoving(details); setDetails(null) }}
          onFindSlots={() => findSlots(details)}
          onToggleLock={() => {
            setLock.mutate({ id: details.scheduledLessonId, isLocked: !details.isLocked })
            setDetails(null)
          }}
          onRemove={() => {
            if (!window.confirm('Remove this lesson from the timetable?')) return
            remove.mutate(details.scheduledLessonId)
            setDetails(null)
          }}
          onSaveRooms={async (roomIds) => {
            setDetails(null)
            await runWithViolationGuard(move.mutateAsync, {
              id: details.scheduledLessonId,
              dayOfWeek: details.dayOfWeek,
              periodId: details.periodId,
              roomIds,
            })
          }}
        />
      )}

      {violation && (
        <ViolationModal
          violations={violation.violations}
          onClose={() => setViolation(null)}
          onOverride={async (codes) => {
            const retry = violation.retry
            setViolation(null)
            try { await retry(codes) } catch { /* a repeat failure re-surfaces via the guard */ }
          }}
        />
      )}

      {swapPreview && (
        <SwapChainModal
          moves={swapPreview.moves}
          periodNumberById={periodNumberById}
          labelByScheduledLessonId={labelByScheduledLessonId}
          isApplying={applySwap.isPending}
          onClose={() => setSwapPreview(null)}
          onConfirm={confirmSwapChain}
        />
      )}

      {editLesson && (
        <LessonForm
          mode="edit"
          initial={editLesson}
          onClose={() => setEditLesson(null)}
          onSubmit={handleLessonEditSubmit}
          isSubmitting={updateLesson.isPending}
          teachers={teachers ?? []}
          classes={classes ?? []}
          subjects={subjects ?? []}
        />
      )}

      {generateOpen && (
        <GenerateModal
          timetableId={id}
          startGeneration={startGeneration}
          optimiseTimetable={optimiseTimetable}
          onClose={() => setGenerateOpen(false)}
          onLaunched={(runId) => {
            setGenerateOpen(false)
            if (runId) navigate(`/scheduling/runs/${runId}`)
          }}
        />
      )}
    </div>
  )
}

const ALGORITHMS = [
  {
    value: 'Greedy', label: 'Greedy', kind: 'build',
    hint: 'Fast first-fit build. Good for a quick draft to refine by hand.',
  },
  {
    value: 'Csp', label: 'CSP backtracking', kind: 'build',
    hint: 'Thorough constraint search. Slower, places more lessons conflict-free.',
  },
  {
    value: 'SimulatedAnnealing', label: 'Simulated Annealing', kind: 'optimise',
    hint: 'Optimises the existing placements for quality. Locked lessons stay put.',
  },
]

const GenerateModal = ({ timetableId, startGeneration, optimiseTimetable, onClose, onLaunched }) => {
  const [algorithm, setAlgorithm] = useState('Greedy')
  const [maxDurationMs, setMaxDurationMs] = useState(30000)
  const [randomSeed, setRandomSeed] = useState('')
  const [clearExisting, setClearExisting] = useState(true)
  const [error, setError] = useState(null)

  const algo = ALGORITHMS.find((a) => a.value === algorithm)
  const isOptimise = algo?.kind === 'optimise'
  const pending = startGeneration.isPending || optimiseTimetable.isPending

  const submit = async () => {
    setError(null)
    const seed = randomSeed === '' ? null : Number(randomSeed)
    try {
      let result
      if (isOptimise) {
        result = await optimiseTimetable.mutateAsync({ timetableId, maxDurationMs, randomSeed: seed })
      } else {
        result = await startGeneration.mutateAsync({
          timetableId, algorithm, maxDurationMs, randomSeed: seed, clearExisting,
        })
      }
      onLaunched(result?.runId ?? null)
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to start generation.')
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHead}>
          <h2 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconBolt size={18} /> Generate timetable
          </h2>
          <button type="button" style={iconBtn} onClick={onClose}><IconX size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {ALGORITHMS.map((a) => {
            const active = a.value === algorithm
            return (
              <button
                key={a.value}
                type="button"
                onClick={() => setAlgorithm(a.value)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left',
                  padding: '10px 14px', borderRadius: 12, cursor: 'pointer', font: 'inherit',
                  background: active ? '#fff8f0' : 'var(--surface, #fff)',
                  border: active
                    ? '1.5px solid var(--brand, #ff8a00)'
                    : '1.5px solid var(--border, #eceef2)',
                  transition: 'border-color .15s, background .15s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-h, #1a1a1a)' }}>{a.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                    padding: '1px 8px', borderRadius: 999,
                    background: a.kind === 'build' ? '#eef4ff' : '#ecfdf5',
                    color: a.kind === 'build' ? '#1e40af' : '#065f46',
                  }}>
                    {a.kind === 'build' ? 'Build' : 'Optimise'}
                  </span>
                </span>
                <span style={{ fontSize: 12, color: 'var(--text, #717171)' }}>{a.hint}</span>
              </button>
            )
          })}
        </div>

        {!isOptimise && (
          <label style={{ ...label, flexDirection: 'row', alignItems: 'center', gap: 8, fontWeight: 500 }}>
            <input type="checkbox" checked={clearExisting} onChange={(e) => setClearExisting(e.target.checked)}
              style={{ accentColor: 'var(--brand, #ff8a00)' }} />
            Clear existing non-locked placements first
          </label>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ ...label, flex: 1 }}>Time budget (seconds)
            <input type="number" min={1} step={1} style={input}
              value={Math.round(maxDurationMs / 1000)}
              onChange={(e) => setMaxDurationMs(Math.max(1, Number(e.target.value)) * 1000)} />
          </label>
          <label style={{ ...label, flex: 1 }}>
            <span style={{ whiteSpace: 'nowrap' }}>
              Seed <span style={{ fontWeight: 400, color: 'var(--text-soft, #9ca3af)' }}>(optional)</span>
            </span>
            <input type="number" style={input} placeholder="random"
              value={randomSeed} onChange={(e) => setRandomSeed(e.target.value)} />
          </label>
        </div>

        {error && (
          <p style={{
            color: '#b91c1c', background: '#fef2f2', borderRadius: 10,
            padding: '8px 12px', fontSize: 13, margin: '4px 0',
          }}>{error}</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button type="button" className="pill-button" style={ghostBtn} onClick={onClose}>Cancel</button>
          <button type="button" className="pill-button" style={generateBtn} disabled={pending} onClick={submit}>
            <IconBolt size={15} style={{ marginRight: 4 }} />
            {pending ? 'Starting…' : isOptimise ? 'Optimise' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Renders the proposed ejection chain so the admin can see exactly which lessons get reshuffled
// before committing. The chain is applied atomically (or rejected if it has gone stale).
const SwapChainModal = ({ moves, periodNumberById, labelByScheduledLessonId, isApplying, onClose, onConfirm }) => {
  const slotLabel = (day, periodId) => `${day} · P${periodNumberById.get(periodId) ?? '?'}`
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHead}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Confirm swap chain</h2>
          <button type="button" style={iconBtn} onClick={onClose}><IconX size={18} /></button>
        </div>
        <p style={{ marginTop: 0, fontSize: 13, color: 'var(--text-soft, #666)' }}>
          To make room for this move, {moves.length} lesson{moves.length === 1 ? '' : 's'} will be
          relocated. Review the chain and apply.
        </p>
        <ol style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {moves.map((m, i) => (
            <li key={`${m.scheduledLessonId}-${i}`} style={{ fontSize: 13 }}>
              <strong>{labelByScheduledLessonId.get(m.scheduledLessonId) || 'Lesson'}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, color: 'var(--text-soft, #555)' }}>
                <span>{slotLabel(m.fromDay, m.fromPeriodId)}</span>
                <IconArrowRight size={14} />
                <span>{slotLabel(m.toDay, m.toPeriodId)}</span>
              </div>
            </li>
          ))}
        </ol>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button type="button" className="pill-button" style={ghostBtn} onClick={onClose}>Cancel</button>
          <button type="button" className="pill-button" disabled={isApplying} onClick={onConfirm}>
            {isApplying ? 'Applying…' : 'Apply chain'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Deterministic pastel palette per subject so the same subject always reads the same color
// across the grid — the single strongest cue for scanning a week at a glance.
const STATUS_CHIP_COLORS = {
  draft: { bg: '#eef4ff', text: '#1e40af' },
  published: { bg: '#ecfdf5', text: '#065f46' },
  archived: { bg: '#f3f4f6', text: '#4b5563' },
}

const StatusChip = ({ status }) => {
  const c = STATUS_CHIP_COLORS[(status ?? '').toLowerCase()] ?? STATUS_CHIP_COLORS.archived
  return (
    <span style={{
      background: c.bg, color: c.text, borderRadius: 999, padding: '3px 12px',
      fontSize: 12, fontWeight: 700, letterSpacing: 0.3, lineHeight: 1.6,
    }}>
      {status ?? '—'}
    </span>
  )
}

const SlotCard = ({ slot, editable, selected, faded, inert, onOpenDetails, onToggleLock, onRemove }) => {
  const subject = slot.subjectNames?.join(', ') || 'Lesson'
  const pal = paletteFor(subject)
  return (
    <div
      className="tt-slot"
      style={{
        ...slotCard,
        background: pal.bg,
        borderLeft: `3px solid ${pal.edge}`,
        ...(selected ? slotCardSelected : null),
        ...(slot.isLocked ? slotCardLocked : null),
        ...(faded ? slotCardFaded : null),
        // While a move/placement is in flight, clicks must reach the cell underneath.
        ...(inert ? { pointerEvents: 'none' } : null),
      }}
      onClick={(e) => { e.stopPropagation(); onOpenDetails() }}
      title="Click for details"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: slot.isLocked ? '#92400e' : pal.text, flex: 1, minWidth: 0 }}>
          {subject}
        </span>
        {slot.teacherNames?.length > 1 && (
          <span title="Co-teaching" style={{ display: 'inline-flex', flexShrink: 0 }}>
            <IconUsers size={12} style={{ color: '#1e40af' }} />
          </span>
        )}
        {slot.subjectNames?.length > 1 && (
          <span title="Multi-subject" style={{ display: 'inline-flex', flexShrink: 0 }}>
            <IconBooks size={12} style={{ color: '#5b21b6' }} />
          </span>
        )}
        {slot.isLocked && <IconLock size={12} style={{ color: '#b45309', flexShrink: 0 }} />}
      </div>
      {slot.teacherNames?.length > 0 && <div style={meta}>{slot.teacherNames.join(', ')}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 6 }}>
        <div style={{ minWidth: 0 }}>
          {slot.classNames?.length > 0 && <div style={meta}>{slot.classNames.join(', ')}</div>}
          {slot.roomNames?.length > 0 && <div style={metaRoom}>{slot.roomNames.join(', ')}</div>}
        </div>
        {editable && (
          <div className="tt-slot-actions" style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <button type="button" style={iconBtn} title={slot.isLocked ? 'Unlock' : 'Lock'}
              onClick={(e) => { e.stopPropagation(); onToggleLock() }}>
              {slot.isLocked ? <IconLockOpen size={13} /> : <IconLock size={13} />}
            </button>
            {!slot.isLocked && (
              <button type="button" style={iconBtn} title="Remove"
                onClick={(e) => { e.stopPropagation(); onRemove() }}>
                <IconTrash size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const FilterSelect = ({ placeholder, value, options, onChange }) => (
  <select
    style={{ ...filterSelect, ...(value ? filterSelectActive : null) }}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="">{placeholder}</option>
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
)

// Slot details + per-placement actions. Room membership is edited inline and saved as a
// "move" to the same (day, period) with the new room set, so the constraint engine
// re-validates room clashes the same way a real move would.
const SlotDetailsModal = ({
  slot, lesson, teacherNameById, rooms, editable, findPending, lockPending, leadPending,
  onClose, onMove, onFindSlots, onToggleLock, onRemove, onSaveRooms, onSetLead, onEditLesson,
}) => {
  const [roomSel, setRoomSel] = useState(() => new Set(slot.roomIds ?? []))
  const subject = slot.subjectNames?.join(', ') || 'Lesson'
  const pal = paletteFor(subject)

  const isCoTeaching = (slot.teacherNames?.length ?? 0) > 1
  const isMultiSubject = (slot.subjectNames?.length ?? 0) > 1
  // Lead editing needs lesson teacher *ids*; the slot only carries names. `lesson` can be
  // undefined (e.g. deactivated lessons drop out of the list query) — fall back to display-only.
  const canEditLead = editable && isCoTeaching && Boolean(lesson)

  const original = new Set(slot.roomIds ?? [])
  const roomsChanged = roomSel.size !== original.size || [...roomSel].some((id) => !original.has(id))
  const toggleRoom = (rid) =>
    setRoomSel((prev) => {
      const next = new Set(prev)
      if (next.has(rid)) next.delete(rid)
      else next.add(rid)
      return next
    })

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHead}>
          <h2 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: pal.edge, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subject}</span>
            {slot.isLocked && <IconLock size={16} style={{ color: '#b45309', flexShrink: 0 }} />}
          </h2>
          <button type="button" style={iconBtn} onClick={onClose}><IconX size={18} /></button>
        </div>

        <dl style={detailList}>
          <dt style={detailTerm}>Slot</dt>
          <dd style={detailValue}>{slot.dayOfWeek} · Period {slot.periodNumber ?? '—'}</dd>
          <dt style={detailTerm}>Type</dt>
          <dd style={{ ...detailValue, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {isCoTeaching && (
              <span style={{ ...typeChip, background: '#eef4ff', color: '#1e40af' }}>
                <IconUsers size={12} /> Co-teaching
              </span>
            )}
            {isMultiSubject && (
              <span style={{ ...typeChip, background: '#f5f3ff', color: '#5b21b6' }}>
                <IconBooks size={12} /> Multi-subject
              </span>
            )}
            {!isCoTeaching && !isMultiSubject && (
              <span style={{ ...typeChip, background: '#f3f4f6', color: '#4b5563' }}>Standard</span>
            )}
          </dd>
          <dt style={detailTerm}>Teachers</dt>
          <dd style={detailValue}>{slot.teacherNames?.join(', ') || '—'}</dd>
          {isCoTeaching && (
            <>
              <dt style={{ ...detailTerm, display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconCrown size={14} style={{ color: '#b45309' }} /> Lead
              </dt>
              <dd style={detailValue}>
                {canEditLead ? (
                  <select
                    style={{ ...input, padding: '5px 8px', fontSize: 13 }}
                    value={lesson.leadTeacherId ?? ''}
                    disabled={leadPending}
                    onChange={(e) => onSetLead(lesson, e.target.value)}
                  >
                    <option value="">— No lead designated —</option>
                    {(lesson.teacherIds ?? []).map((tid) => (
                      <option key={tid} value={tid}>{teacherNameById.get(tid) ?? tid}</option>
                    ))}
                  </select>
                ) : (
                  slot.leadTeacherName ?? '—'
                )}
              </dd>
            </>
          )}
          <dt style={detailTerm}>Classes</dt>
          <dd style={detailValue}>{slot.classNames?.join(', ') || '—'}</dd>
          <dt style={detailTerm}>Rooms</dt>
          <dd style={detailValue}>{slot.roomNames?.join(', ') || '—'}</dd>
          <dt style={detailTerm}>Status</dt>
          <dd style={detailValue}>{slot.isLocked ? 'Locked — generators and moves leave it in place' : 'Unlocked'}</dd>
        </dl>

        {editable && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <button type="button" className="pill-button" style={generateBtn}
                disabled={findPending} onClick={onFindSlots}>
                <IconSearch size={15} style={{ marginRight: 4 }} />
                {findPending ? 'Searching…' : 'Find available slots'}
              </button>
              <button type="button" className="pill-button" style={ghostBtn}
                disabled={slot.isLocked} onClick={onMove}
                title={slot.isLocked ? 'Unlock first to move' : undefined}>
                Move…
              </button>
              {lesson && (
                <button type="button" className="pill-button" style={ghostBtn}
                  onClick={() => onEditLesson(lesson)}>
                  <IconPencil size={14} style={{ marginRight: 4 }} /> Edit lesson
                </button>
              )}
              <button type="button" className="pill-button" style={ghostBtn}
                disabled={lockPending} onClick={onToggleLock}>
                {slot.isLocked ? 'Unlock' : 'Lock'}
              </button>
              <button type="button" className="pill-button"
                style={{ ...ghostBtn, color: '#b91c1c' }}
                disabled={slot.isLocked} onClick={onRemove}>
                Remove
              </button>
            </div>

            <div style={{ ...label, marginBottom: 0 }}>
              Rooms ({roomSel.size} selected)
              <div style={roomPicker}>
                {rooms.map((r) => (
                  <label key={r.id} style={roomPickerItem}>
                    <input type="checkbox" checked={roomSel.has(r.id)} onChange={() => toggleRoom(r.id)} />
                    <span>{r.name ?? r.roomNumber ?? r.id}</span>
                  </label>
                ))}
                {rooms.length === 0 && (
                  <span style={{ color: 'var(--text-soft, #9ca3af)', fontSize: 12 }}>No rooms defined</span>
                )}
              </div>
            </div>
            {roomsChanged && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button type="button" className="pill-button" style={ghostBtn}
                  onClick={() => setRoomSel(new Set(slot.roomIds ?? []))}>
                  Reset
                </button>
                <button type="button" className="pill-button"
                  disabled={roomSel.size === 0} onClick={() => onSaveRooms([...roomSel])}>
                  Save rooms
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const AddLessonModal = ({ lessons, rooms, target, isSubmitting, onClose, onSubmit }) => {
  const [lessonId, setLessonId] = useState('')
  const [roomId, setRoomId] = useState('')
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHead}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Place lesson · {target.day}</h2>
          <button type="button" style={iconBtn} onClick={onClose}><IconX size={18} /></button>
        </div>
        <label style={label}>Lesson
          <select style={input} value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
            <option value="">Select a lesson…</option>
            {lessons.map((l) => <option key={l.id} value={l.id}>{lessonLabel(l)}</option>)}
          </select>
        </label>
        <label style={label}>Room
          <select style={input} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">Select a room…</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name ?? r.code ?? r.id}</option>)}
          </select>
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button type="button" className="pill-button" style={ghostBtn} onClick={onClose}>Cancel</button>
          <button type="button" className="pill-button" disabled={!lessonId || !roomId || isSubmitting}
            onClick={() => onSubmit({ lessonId, roomId })}>
            {isSubmitting ? 'Placing…' : 'Place'}
          </button>
        </div>
      </div>
    </div>
  )
}

const ViolationModal = ({ violations, onClose, onOverride }) => {
  // A violation is overridable unless the API flags it non-ignorable (physical double-booking).
  const canIgnore = (v) => v.ignorable !== false
  // Only overridable rules start checked; non-ignorable rules can never be selected.
  const [ignored, setIgnored] = useState(() => violations.filter(canIgnore).map((v) => v.code))
  const toggle = (code) =>
    setIgnored((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code])
  // Blocked outright when a non-ignorable conflict is present — no override can place it.
  const hasBlocking = violations.some((v) => !canIgnore(v))
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHead}>
          <h2 style={{ margin: 0, fontSize: 18, color: 'crimson' }}>Hard-constraint conflict</h2>
          <button type="button" style={iconBtn} onClick={onClose}><IconX size={18} /></button>
        </div>
        <p style={{ marginTop: 0, fontSize: 13, color: 'var(--text-soft, #666)' }}>
          {hasBlocking
            ? 'Some conflicts cannot be overridden — a teacher, class, or room cannot be in two places at once.'
            : 'Check the rules you want to override, then place anyway.'}
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {violations.map((v) => (
            <li key={v.code} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', opacity: canIgnore(v) ? 1 : 0.7 }}>
              {canIgnore(v) ? (
                <input type="checkbox" checked={ignored.includes(v.code)} onChange={() => toggle(v.code)} />
              ) : (
                <span title="This conflict cannot be overridden" style={{ fontSize: 13 }}>🔒</span>
              )}
              <span><strong>{v.code}</strong> — {v.message}{!canIgnore(v) && <em style={{ color: 'crimson' }}> (cannot override)</em>}</span>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button type="button" className="pill-button" style={ghostBtn} onClick={onClose}>Cancel</button>
          {!hasBlocking && (
            <button type="button" className="pill-button" disabled={ignored.length === 0}
              onClick={() => onOverride(ignored)}>
              Override &amp; place
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── inline styles (match the app's existing inline-style convention) ──
const gridCard = {
  background: 'var(--surface, #fff)',
  border: '1px solid var(--border, #eceef2)',
  borderRadius: 14,
  boxShadow: 'var(--shadow-soft, 0px 4px 20px rgba(0,0,0,0.05))',
  overflow: 'hidden',
  // Fill the remaining column height so the grid (not the page) owns the scroll. Robust to the
  // move/placement banner changing how much space is left — no viewport math to get wrong.
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
}
// Scroll container: the grid scrolls inside the card (both axes) so a tall week or a wide day
// set never depends on the page scrolling. Header row and period column stay pinned.
const gridScroll = { flex: 1, minHeight: 0, overflow: 'auto' }
const gridTable = { width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 760 }
const thCell = {
  textAlign: 'center', padding: '12px 12px', fontSize: 12, fontWeight: 700,
  color: 'var(--text-soft, #9ca3af)', textTransform: 'uppercase', letterSpacing: 0.6,
  borderBottom: '1px solid var(--border, #eceef2)', background: '#f6f8fa',
}
const thSticky = { position: 'sticky', top: 0, zIndex: 2 }
const thCorner = { position: 'sticky', top: 0, left: 0, zIndex: 3, textAlign: 'left' }
const periodCell = {
  position: 'sticky', left: 0, zIndex: 1,
  padding: '10px 12px', borderBottom: '1px solid var(--border, #eceef2)',
  borderRight: '1px solid var(--border, #eceef2)', whiteSpace: 'nowrap',
  verticalAlign: 'top', background: '#f6f8fa', textAlign: 'center',
}
const periodBadge = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26, borderRadius: 8, fontSize: 13, fontWeight: 700,
  color: 'var(--text-h, #1a1a1a)', background: 'var(--surface, #fff)',
  border: '1px solid var(--border, #eceef2)',
}
const gridCell = {
  padding: 6, borderBottom: '1px solid var(--border, #eceef2)',
  borderRight: '1px solid var(--border, #eceef2)', verticalAlign: 'top',
  minWidth: 136, height: 72, cursor: 'pointer', textAlign: 'center',
}
const addHint = { color: 'var(--brand, #ff8a00)', fontSize: 20, fontWeight: 600, lineHeight: '60px' }
const slotCard = {
  borderRadius: 8, padding: '6px 8px', marginBottom: 4,
  border: '1px solid transparent', textAlign: 'left', cursor: 'pointer',
}
const slotCardSelected = { boxShadow: '0 0 0 2px var(--brand, #ff8a00)' }
const slotCardLocked = { background: '#fff7ed', borderLeft: '3px solid #f59e0b' }
const slotCardFaded = { opacity: 0.28, filter: 'grayscale(0.7)' }
const availableCell = {
  background: '#ecfdf5',
  boxShadow: 'inset 0 0 0 2px #10b981',
  cursor: 'pointer',
}
const filterBar = {
  display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
  padding: '10px 14px', marginBottom: 12,
  background: 'var(--surface, #fff)', border: '1px solid var(--border, #eceef2)',
  borderRadius: 12,
}
const filterSelect = {
  padding: '7px 10px', borderRadius: 9, fontSize: 13, font: 'inherit',
  border: '1px solid var(--border, #eceef2)', background: '#fff',
  color: 'var(--text, #717171)', outline: 'none', maxWidth: 180,
}
const filterSelectActive = {
  borderColor: 'var(--brand, #ff8a00)', color: 'var(--text-h, #1a1a1a)', fontWeight: 600,
}
const modeToggle = {
  display: 'inline-flex', borderRadius: 9, overflow: 'hidden',
  border: '1px solid var(--border, #eceef2)', flexShrink: 0,
}
const modeBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '7px 10px', border: 'none', background: '#fff', cursor: 'pointer',
  color: 'var(--text-soft, #9ca3af)',
}
const modeBtnActive = {
  background: '#fff8f0', color: 'var(--brand, #ff8a00)',
}
const hideToggle = {
  display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, whiteSpace: 'nowrap',
  color: 'var(--text, #717171)', cursor: 'pointer',
}
const detailList = {
  display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px',
  margin: '0 0 16px', fontSize: 13,
}
const detailTerm = { color: 'var(--text-soft, #9ca3af)', fontWeight: 600 }
const detailValue = { margin: 0, color: 'var(--text-h, #1a1a1a)' }
const typeChip = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
}
const roomPicker = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: '6px 12px', maxHeight: 150, overflowY: 'auto', padding: 8,
  border: '1px solid var(--border, #eceef2)', borderRadius: 10,
}
const roomPickerItem = {
  display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, fontWeight: 400,
  color: 'var(--text-h, #1a1a1a)',
}
const meta = {
  fontSize: 11, color: 'var(--text, #717171)',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}
const metaRoom = { fontSize: 11, fontWeight: 600, color: 'var(--text, #717171)' }
const iconBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 6,
  cursor: 'pointer', padding: 3, color: 'var(--text, #717171)',
}
const banner = {
  display: 'flex', alignItems: 'center', padding: '10px 14px',
  background: '#fff8f0', border: '1px solid #ffd9ab', borderRadius: 10,
  marginBottom: 12, fontSize: 13, color: 'var(--text-h, #1a1a1a)',
}
const bannerDot = {
  width: 8, height: 8, borderRadius: 999, background: 'var(--brand, #ff8a00)',
  marginRight: 10, flexShrink: 0,
}
const toggleRow = {
  display: 'flex', gap: 8, alignItems: 'center', fontSize: 13,
  marginBottom: 12, color: 'var(--text, #717171)', cursor: 'pointer', width: 'fit-content',
}
const linkBtn = {
  background: 'none', border: 'none', color: 'var(--brand, #ff8a00)',
  cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit', fontWeight: 600,
}
const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', backdropFilter: 'blur(2px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
}
const modal = {
  background: 'var(--surface, #fff)', borderRadius: 16, padding: 24,
  width: 'min(460px, 92vw)', boxShadow: '0 24px 70px rgba(0,0,0,0.22)',
  maxHeight: '88vh', overflowY: 'auto',
}
const modalHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }
const label = {
  display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 600,
  color: 'var(--text-h, #1a1a1a)', marginBottom: 12,
}
const input = {
  padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border, #eceef2)',
  fontSize: 14, font: 'inherit', color: 'var(--text-h, #1a1a1a)', background: '#fff', outline: 'none',
}
const ghostBtn = { background: 'var(--surface, #fff)', color: 'var(--text-h, #1a1a1a)', borderColor: 'var(--border, #eceef2)' }
const generateBtn = { display: 'inline-flex', alignItems: 'center' }
const dangerBtn = { background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }

export default TimetableEditorPage
