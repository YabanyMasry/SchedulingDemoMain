import { Link } from 'react-router-dom'
import { 
  IconDatabaseImport, 
  IconHistory, 
  IconSettingsAutomation,
  IconUserCheck
} from '@tabler/icons-react'

const tools = [
  {
    title: 'Data Imports',
    description: 'Bulk upload school and resource data',
    href: '/system/import',
    icon: <IconDatabaseImport size={24} />
  },
  {
    title: 'Backups',
    description: 'Restore and manage database snapshots',
    href: '/system/backup',
    icon: <IconHistory size={24} />
  },
  {
    title: 'Scheduling Constraints',
    description: 'Global rules for timetable generation',
    href: '/system/constraints',
    icon: <IconSettingsAutomation size={24} />
  },
  {
    title: 'Pending Approvals',
    description: 'Review and approve or reject user registrations',
    href: '/system/pending-users',
    icon: <IconUserCheck size={24} />
  }
]

const ImportJobsPage = () => {
  return (
    <div className="page-card">
      <h1>System Operations</h1>
      <p>Data operations and internal platform configurations.</p>
      
      <div className="resource-grid">
        {tools.map((tool) => (
          <Link key={tool.href} to={tool.href} className="resource-card">
            <div className="resource-card-icon">
              {tool.icon}
            </div>
            <div className="resource-card-info">
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ImportJobsPage
