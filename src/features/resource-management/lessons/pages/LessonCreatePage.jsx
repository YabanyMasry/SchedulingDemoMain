import PagePlaceholder from '../../../../components/PagePlaceholder'

const LessonCreatePage = () => (
  <PagePlaceholder
    title="Create Lesson"
    summary="Stub for creating lessons with availability checks."
    todos={['Form for subject/teacher/class/room', 'Validate availability and constraints', 'Persist draft/published states']}
    tags={['lessons', 'create']}
  />
)

export default LessonCreatePage
