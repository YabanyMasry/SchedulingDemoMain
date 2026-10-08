import { useMemo, useState } from 'react'
import EntityShell from '../../components/common/EntityShell'
import RMFilterPanel from '../../components/organisms/RMFilterPanel'
import { useRMFilters } from '../../common/filtering/useRMFilters'
import {
  useLessonsQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useSetLessonActiveMutation,
  useDeleteLessonMutation,
  useAddLessonTeacherMutation,
  useRemoveLessonTeacherMutation,
  useAddLessonClassMutation,
  useRemoveLessonClassMutation,
  useAddLessonSubjectMutation,
  useRemoveLessonSubjectMutation,
  useSetLessonAssignmentsMutation,
} from '../api/hooks'
import { useTeachersQuery } from '../../teachers/api/hooks'
import { useClassesQuery } from '../../classes/api/hooks'
import { useSubjectsQuery } from '../../subjects/api/hooks'
import LessonForm from '../components/LessonForm'

const COLUMNS = [
  { accessorKey: 'duration', header: 'Duration' },
  { accessorKey: 'frequencyPerWeek', header: 'Freq/Week' },
  { accessorKey: 'teachers', header: 'Teachers' },
  { accessorKey: 'classes', header: 'Classes' },
  { accessorKey: 'subjects', header: 'Subjects' },
  { accessorKey: 'requiredRoomType', header: 'Room Type' },
  { accessorKey: 'priority', header: 'Priority' },
  { accessorKey: 'status', header: 'Status' },
]

const FACETS = [
  { key: 'status', title: 'Status', getValue: (row) => row.status },
  { key: 'requiredRoomType', title: 'Room Type', getValue: (row) => row.requiredRoomType === '—' ? null : row.requiredRoomType },
]

const diffSets = (before, after) => {
  const added = after.filter((id) => !before.includes(id))
  const removed = before.filter((id) => !after.includes(id))
  return { added, removed }
}

const LessonsDashboardPage = () => {
  const { data: lessons, isLoading, isError } = useLessonsQuery()
  const { data: teachers } = useTeachersQuery()
  const { data: classes } = useClassesQuery()
  const { data: subjects } = useSubjectsQuery()

  const create = useCreateLessonMutation()
  const update = useUpdateLessonMutation()
  const setActive = useSetLessonActiveMutation()
  const hardDelete = useDeleteLessonMutation()
  const addTeacher = useAddLessonTeacherMutation()
  const removeTeacher = useRemoveLessonTeacherMutation()
  const addClass = useAddLessonClassMutation()
  const removeClass = useRemoveLessonClassMutation()
  const addSubject = useAddLessonSubjectMutation()
  const removeSubject = useRemoveLessonSubjectMutation()
  const setAssignments = useSetLessonAssignmentsMutation()

  const [modal, setModal] = useState(null)

  const teacherMap = useMemo(
    () => Object.fromEntries((teachers ?? []).map((t) => [t.id, `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() || t.username || t.id])),
    [teachers],
  )
  const classMap = useMemo(
    () => Object.fromEntries((classes ?? []).map((c) => [c.id, c.name || c.code || c.id])),
    [classes],
  )
  const subjectMap = useMemo(
    () => Object.fromEntries((subjects ?? []).map((s) => [s.id, s.name || s.code || s.id])),
    [subjects],
  )
  const rawById = useMemo(
    () => Object.fromEntries((lessons ?? []).map((l) => [l.id, l])),
    [lessons],
  )

  const resolvedData = useMemo(
    () =>
      (lessons ?? []).map((l) => ({
        id: l.id,
        duration: l.duration,
        frequencyPerWeek: l.frequencyPerWeek,
        teachers: (l.teacherIds ?? []).map((id) => teacherMap[id] ?? '?').join(', ') || '—',
        classes: (l.classIds ?? []).map((id) => classMap[id] ?? '?').join(', ') || '—',
        subjects: (l.subjectIds ?? []).map((id) => subjectMap[id] ?? '?').join(', ') || '—',
        requiredRoomType: l.requiredRoomType ?? '—',
        priority: l.priority ?? '—',
        status: l.isActive ? 'Active' : 'Inactive',
      })),
    [lessons, teacherMap, classMap, subjectMap],
  )

  const filters = useRMFilters(resolvedData, FACETS)

  const handleSubmit = async ({ core, teacherIds, classIds, subjectIds, assignments }) => {
    if (modal.mode === 'create') {
      create.mutate(
        { ...core, teacherIds, classIds, subjectIds, assignments },
        { onSuccess: () => setModal(null) },
      )
      return
    }
    const id = modal.entity.id
    const before = {
      teachers: modal.entity.teacherIds ?? [],
      classes: modal.entity.classIds ?? [],
      subjects: modal.entity.subjectIds ?? [],
    }
    try {
      // Junctions first: the core update carries leadTeacherId, and the API validates
      // the lead against the lesson's *current* teacher set.
      const tDiff = diffSets(before.teachers, teacherIds)
      const cDiff = diffSets(before.classes, classIds)
      const sDiff = diffSets(before.subjects, subjectIds)
      await Promise.all([
        ...tDiff.added.map((teacherId) => addTeacher.mutateAsync({ lessonId: id, teacherId })),
        ...tDiff.removed.map((teacherId) => removeTeacher.mutateAsync({ lessonId: id, teacherId })),
        ...cDiff.added.map((classId) => addClass.mutateAsync({ lessonId: id, classId })),
        ...cDiff.removed.map((classId) => removeClass.mutateAsync({ lessonId: id, classId })),
        ...sDiff.added.map((subjectId) => addSubject.mutateAsync({ lessonId: id, subjectId })),
        ...sDiff.removed.map((subjectId) => removeSubject.mutateAsync({ lessonId: id, subjectId })),
      ])
      await update.mutateAsync({ id, ...core })
      // Assignments validate against the lesson's current teacher/subject sets, so they
      // must be set after the junction sync above has landed. Replaces the full set.
      await setAssignments.mutateAsync({ lessonId: id, assignments })
      setModal(null)
    } catch (err) {
      console.error('Lesson update failed', err)
    }
  }

  const filterPanel = (
    <RMFilterPanel
      isOpen={filters.isFilterOpen}
      activeFilterCount={filters.activeFilterCount}
      resultCount={filters.filteredData.length}
      onClearAll={filters.clearAll}
      facets={filters.facets}
      activeFilterChips={filters.activeFilterChips}
    />
  )

  const submitting =
    create.isPending ||
    update.isPending ||
    addTeacher.isPending ||
    removeTeacher.isPending ||
    addClass.isPending ||
    removeClass.isPending ||
    addSubject.isPending ||
    removeSubject.isPending ||
    setAssignments.isPending

  return (
    <>
      <EntityShell
        name="Lessons"
        tableData={filters.filteredData}
        tableColumns={COLUMNS}
        isLoading={isLoading}
        isError={isError}
        searchQuery={filters.searchQuery}
        setSearchQuery={filters.setSearchQuery}
        filterPanel={filterPanel}
        isFilterOpen={filters.isFilterOpen}
        onFilterToggle={filters.toggleFilterPanel}
        onDeleteRow={(row) => setActive.mutate({ id: row.id, isActive: false })}
        onDeleteSelected={(ids) => ids.forEach((id) => setActive.mutate({ id, isActive: false }))}
        onActivateSelected={(ids) => ids.forEach((id) => setActive.mutate({ id, isActive: true }))}
        onHardDeleteRow={(row) => hardDelete.mutate(row.id)}
        onHardDeleteSelected={(ids) => ids.forEach((id) => hardDelete.mutate(id))}
        onEditRow={(row) => setModal({ mode: 'edit', entity: rawById[row.id] })}
        onAddRow={() => setModal({ mode: 'create', entity: null })}
      />
      {modal && (
        <LessonForm
          mode={modal.mode}
          initial={modal.entity}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
          teachers={teachers}
          classes={classes}
          subjects={subjects}
        />
      )}
    </>
  )
}

export default LessonsDashboardPage
