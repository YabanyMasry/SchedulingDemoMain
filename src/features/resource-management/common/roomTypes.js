// Canonical room types offered when creating/editing a Room or a Lesson's required
// room type. The backend stores a free-text string, so a legacy value outside this
// list still renders (the selects append it as an extra option).
export const ROOM_TYPES = [
  'Classroom',
  'Laboratory',
  'Computer Lab',
  'Gymnasium',
  'Art Room',
  'Music Room',
  'Auditorium',
  'Library',
]
