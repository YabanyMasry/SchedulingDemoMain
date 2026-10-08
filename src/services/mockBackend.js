import MockAdapter from 'axios-mock-adapter';

// Mock initial data
// Mock initial data
const initialData = {
  teachers: Array.from({ length: 15 }).map((_, i) => ({
    id: `t${i + 1}`,
    displayName: `Teacher ${i + 1}`,
    firstName: `TFirst${i + 1}`,
    lastName: `TLast${i + 1}`,
    email: `teacher${i + 1}@school.edu`,
    department: i % 2 === 0 ? 'Science' : 'Math',
    status: 'Active',
    weeklyQuota: 20 + (i % 5),
  })),
  subjects: [
    { id: 's1', code: 'MATH101', name: 'Mathematics 1', category: 'Core', status: 'Active' },
    { id: 's2', code: 'MATH201', name: 'Mathematics 2', category: 'Core', status: 'Active' },
    { id: 's3', code: 'PHY101', name: 'Physics 1', category: 'Core', status: 'Active' },
    { id: 's4', code: 'PHY201', name: 'Physics 2', category: 'Core', status: 'Active' },
    { id: 's5', code: 'CHEM101', name: 'Chemistry 1', category: 'Core', status: 'Active' },
    { id: 's6', code: 'BIO101', name: 'Biology 1', category: 'Core', status: 'Active' },
    { id: 's7', code: 'ENG101', name: 'English Lit 1', category: 'Core', status: 'Active' },
    { id: 's8', code: 'HIS101', name: 'History 1', category: 'Core', status: 'Active' },
  ],
  students: Array.from({ length: 30 }).map((_, i) => ({
    id: `st${i + 1}`,
    name: `Student ${i + 1}`,
    fullName: `Student ${i + 1} Last`,
    studentNumber: `ST${1000 + i}`,
    className: i < 15 ? '10A' : '10B',
    status: 'Active',
  })),
  rooms: Array.from({ length: 10 }).map((_, i) => ({
    id: `r${i + 1}`,
    roomNumber: `10${i + 1}`,
    name: `Room 10${i + 1}`,
    capacity: 30,
    roomType: i > 7 ? 'Lab' : 'Classroom',
    status: 'Active',
  })),
  classes: [
    { id: 'c1', name: '10A', grade: '10', homeRoom: '101', status: 'Active' },
    { id: 'c2', name: '10B', grade: '10', homeRoom: '102', status: 'Active' },
    { id: 'c3', name: '11A', grade: '11', homeRoom: '103', status: 'Active' },
    { id: 'c4', name: '11B', grade: '11', homeRoom: '104', status: 'Active' },
  ],
  periods: Array.from({ length: 8 }).map((_, i) => ({
    id: `p${i + 1}`,
    periodNumber: i + 1,
    name: `Period ${i + 1}`,
    startTime: `${8 + i}:00`,
    endTime: `${8 + i}:45`,
    durationMinutes: 45,
    isBreak: i === 3,
    status: 'Active',
  })),
  departments: [
    { id: 'd1', name: 'Science', status: 'Active' },
    { id: 'd2', name: 'Math', status: 'Active' },
    { id: 'd3', name: 'Humanities', status: 'Active' },
  ],
  'school-years': [
    { id: 'sy1', name: '2026-2027', startDate: '2026-09-01', endDate: '2027-06-30', isCurrent: true, status: 'Active' },
    { id: 'sy2', name: '2027-2028', startDate: '2027-09-01', endDate: '2028-06-30', isCurrent: false, status: 'Active' },
  ],
  terms: [
    { id: 'term1', schoolYearId: 'sy1', name: 'Fall Term', startDate: '2026-09-01', endDate: '2026-12-15' },
    { id: 'term2', schoolYearId: 'sy1', name: 'Spring Term', startDate: '2027-01-10', endDate: '2027-06-30' },
  ],
  lessons: Array.from({ length: 15 }).map((_, i) => ({
    id: `l${i + 1}`,
    name: `Lesson ${i + 1}`,
    subjectId: `s${(i % 8) + 1}`,
    teacherId: `t${(i % 15) + 1}`,
    classId: `c${(i % 4) + 1}`,
    status: 'Active',
  })),
  timetable: [
    { id: 'tt1', name: 'Fall 2026 Schedule', validFrom: '2026-09-01', validTo: '2026-12-31', isPublished: true, isArchived: false, schoolYearId: 'sy1' },
    { id: 'tt2', name: 'Spring 2027 Draft', validFrom: '2027-01-10', validTo: '2027-06-30', isPublished: false, isArchived: false, schoolYearId: 'sy1' }
  ],
  'timetable/my': [
    { id: 'tt1', name: 'My Fall 2026 Schedule', validFrom: '2026-09-01', validTo: '2026-12-31', isPublished: true, isArchived: false }
  ],
  'scheduled-lessons': Array.from({ length: 20 }).map((_, i) => ({
    id: `sl${i + 1}`,
    timetableId: 'tt1',
    lessonId: `l${(i % 15) + 1}`,
    dayOfWeek: (i % 5) + 1, // 1 to 5 (Monday to Friday)
    periodId: `p${(i % 8) + 1}`,
    roomIds: [`r${(i % 10) + 1}`],
    isLocked: false,
  })),
  absences: [],
  appeals: [],
  'break-duties': [],
  'my-substitutions': [],
};

// Retrieve from localStorage or use initialData
const loadDb = () => {
  const saved = localStorage.getItem('schedulingAppMockDb_v2');
  if (saved) {
    try {
      return { ...initialData, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to parse mock DB', e);
    }
  }
  return initialData;
};

const saveDb = (db) => {
  localStorage.setItem('schedulingAppMockDb_v2', JSON.stringify(db));
};

let db = loadDb();

export const setupMockBackend = (apiInstance) => {
  const mock = new MockAdapter(apiInstance, { delayResponse: 400 });

  mock.onAny().reply((config) => {
    const method = config.method.toUpperCase();
    let url = config.url.replace('/api/', '').replace(/^\//, ''); // Normalize URL
    
    // Remove query params
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      url = url.substring(0, queryIndex);
    }

    console.log(`[Mock API] ${method} ${url}`);

    // Some specific exact matches
    if (url === 'timetable/my' && method === 'GET') return [200, db['timetable/my']];
    if (url === 'substitution/my-substitutions' && method === 'GET') return [200, db['my-substitutions']];
    if (url === 'substitution/absences' && method === 'GET') return [200, db['absences']];
    if (url === 'substitution/appeals' && method === 'GET') return [200, db['appeals']];
    if (url === 'substitution/break-duties' && method === 'GET') return [200, db['break-duties']];
    if (url === 'substitution/board' && method === 'GET') return [200, []];
    if (url === 'substitution/analytics' && method === 'GET') return [200, []];
    if (url === 'scheduling/generate' && method === 'POST') return [200, { runId: 'run-' + Math.random() }];
    if (url === 'scheduling/optimise' && method === 'POST') return [200, { runId: 'run-' + Math.random() }];
    if (url === 'scheduling/runs' && method === 'GET') return [200, { items: [] }];
    if (url.startsWith('scheduling/runs/') && method === 'GET') return [200, { id: url.split('/')[2], status: 'Completed' }];
    if (url === 'scheduling/move' && method === 'POST') return [200, { applied: true }];
    if (url === 'scheduling/swap-chains/apply' && method === 'POST') return [200, { success: true }];
    
    if (url === 'admin/users/pending' && method === 'GET') return [200, [{ id: 'u1', name: 'New Teacher', email: 'new@teacher.com' }]];
    if (url.startsWith('admin/users/') && url.endsWith('/approve') && method === 'POST') return [200, { success: true }];
    if (url.startsWith('admin/users/') && url.endsWith('/reject') && method === 'POST') return [200, { success: true }];
    if (url.startsWith('resource-management/import/') && method === 'POST') return [200, { total: 10, imported: 10, failed: 0, errors: [] }];

    const parts = url.split('/');
    
    let resourcePrefix = '';
    let resource = parts[0];
    let id = parts[1];
    let subResource = parts[2];

    const compoundNamespaces = ['resource-management', 'scheduling', 'system', 'substitutions', 'substitution', 'profile'];
    
    if (compoundNamespaces.includes(parts[0])) {
      if (parts.length > 1) {
        resourcePrefix = parts[0];
        resource = parts[1];
        id = parts[2];
        subResource = parts[3];
      } else {
        resource = parts[0];
        id = null;
      }
    } else if (parts[0] === 'timetable') {
      const subNamespaces = ['school-years', 'terms', 'scheduled-lessons'];
      if (subNamespaces.includes(parts[1])) {
        resource = parts[1];
        id = parts[2];
        subResource = parts[3];
      } else if (parts[2] === 'scheduled-lessons') {
        // e.g. /timetable/tt1/scheduled-lessons
        // For GET timetable/tt1/scheduled-lessons, we just want to return the scheduled lessons for this timetable
        resource = 'scheduled-lessons';
        id = null; 
      } else {
        resource = 'timetable';
        id = parts[1];
        subResource = parts[2];
      }
    }

    if (!db[resource]) {
      console.warn(`[Mock API] Missing mock data for resource: ${resource}`);
      db[resource] = [];
    }

    // Special handlers for action endpoints
    if (method === 'POST' || method === 'DELETE' || method === 'PUT') {
       if (subResource === 'activate' || subResource === 'deactivate') {
           const index = db[resource].findIndex(i => i.id === id);
           if (index !== -1) {
             db[resource][index].status = subResource === 'activate' ? 'Active' : 'Inactive';
             saveDb(db);
             return [200, db[resource][index]];
           }
       }
       if (subResource === 'hard' && method === 'DELETE') {
           db[resource] = db[resource].filter(i => i.id !== id);
           saveDb(db);
           return [200, { success: true }];
       }
       
       if (subResource === 'rename' && method === 'PUT') {
           const payload = config.data ? JSON.parse(config.data) : {};
           const index = db[resource].findIndex(i => i.id === id);
           if (index !== -1) {
             db[resource][index].name = payload.newName;
             saveDb(db);
             return [200, db[resource][index]];
           }
       }
       
       if (subResource === 'publish' && method === 'POST') {
           const index = db[resource].findIndex(i => i.id === id);
           if (index !== -1) {
             db[resource][index].isPublished = true;
             saveDb(db);
             return [200, db[resource][index]];
           }
       }
       
       if (subResource === 'archive' && method === 'POST') {
           const index = db[resource].findIndex(i => i.id === id);
           if (index !== -1) {
             db[resource][index].isArchived = true;
             saveDb(db);
             return [200, db[resource][index]];
           }
       }

       if (subResource === 'unarchive' && method === 'POST') {
           const index = db[resource].findIndex(i => i.id === id);
           if (index !== -1) {
             db[resource][index].isArchived = false;
             saveDb(db);
             return [200, db[resource][index]];
           }
       }

       // If method is DELETE and no subResource, it's usually soft delete
       if (method === 'DELETE' && !subResource) {
           const index = db[resource].findIndex(i => i.id === id);
           if (index !== -1) {
             if (['scheduled-lessons', 'terms', 'school-years'].includes(resource)) {
               db[resource].splice(index, 1);
             } else {
               db[resource][index].status = 'Inactive'; // soft delete
             }
             saveDb(db);
             return [200, db[resource][index] || { success: true }];
           }
       }
    }

    if (method === 'GET') {
      if (id) {
        if (subResource) {
          // Returning an empty array for any sub-resources (like scheduled-lessons, subjects, availability)
          console.log(`[Mock API] Returning empty array for subresource ${subResource}`);
          return [200, []];
        }
        const item = db[resource].find(i => i.id === id);
        return item ? [200, item] : [404, { message: 'Not found' }];
      }
      return [200, db[resource]];
    }

    if (method === 'POST') {
      const payload = config.data ? JSON.parse(config.data) : {};
      const newItem = { id: Math.random().toString(36).substr(2, 9), ...payload };
      db[resource].push(newItem);
      saveDb(db);
      return [201, newItem];
    }

    if (method === 'PUT') {
      const payload = config.data ? JSON.parse(config.data) : {};
      const index = db[resource].findIndex(i => i.id === id);
      if (index !== -1) {
        db[resource][index] = { ...db[resource][index], ...payload };
        saveDb(db);
        return [200, db[resource][index]];
      }
      return [404, { message: 'Not found' }];
    }

    return [200, { success: true }];
  });
};
