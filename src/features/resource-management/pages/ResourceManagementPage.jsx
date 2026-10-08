import { Link } from 'react-router-dom'
import { 
  IconUsers, 
  IconSchool, 
  IconBook, 
  IconDoor, 
  IconNotebook,
  IconCalendar,
  IconClock, 
  IconHierarchy, 
  IconUserCircle,
  IconVersions
} from '@tabler/icons-react'

const resources = [
  {
    title: 'Lessons',
    description: 'Manage classroom lessons and assignments',
    href: '/resource-management/lessons',
    icon: <IconNotebook size={24} />
  },
  {
    title: 'Teachers',
    description: 'Faculty roster and availability',
    href: '/resource-management/teachers',
    icon: <IconSchool size={24} />
  },
  {
    title: 'Classes',
    description: 'Student groups and class rosters',
    href: '/resource-management/classes',
    icon: <IconVersions size={24} />
  },
  {
    title: 'Subjects',
    description: 'Course catalog and curriculum',
    href: '/resource-management/subjects',
    icon: <IconBook size={24} />
  },
  {
    title: 'Rooms',
    description: 'Available classrooms and facilities',
    href: '/resource-management/rooms',
    icon: <IconDoor size={24} />
  },
  {
    title: 'School Years',
    description: 'Academic calendar and terms',
    href: '/resource-management/school-years',
    icon: <IconCalendar size={24} />
  },
  {
    title: 'Periods',
    description: 'Daily time slots and bell schedules',
    href: '/resource-management/periods',
    icon: <IconClock size={24} />
  },
  {
    title: 'Students',
    description: 'Individual student profiles',
    href: '/resource-management/students',
    icon: <IconUsers size={24} />
  },
  {
    title: 'Departments',
    description: 'Faculty and resource grouping',
    href: '/resource-management/departments',
    icon: <IconHierarchy size={24} />
  },
  {
    title: 'Users',
    description: 'System access and permissions',
    href: '/resource-management/users',
    icon: <IconUserCircle size={24} />
  }
]

const ResourceManagementPage = () => {
  return (
    <div className="page-card">
      <h1>Resource Management</h1>
      <p>Central directory for all system resources and entities.</p>
      
      <div className="resource-grid">
        {resources.map((res) => (
          <Link key={res.href} to={res.href} className="resource-card">
            <div className="resource-card-icon">
              {res.icon}
            </div>
            <div className="resource-card-info">
              <h3>{res.title}</h3>
              <p>{res.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ResourceManagementPage
