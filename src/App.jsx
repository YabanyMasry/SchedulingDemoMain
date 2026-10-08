import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import './App.css'
import AppLayout from './components/AppLayout'
import {
  AuthFallbackRedirect,
  RequireAuth,
  RequireGuest,
  RequireRole,
  RoleHomeRedirect,
} from './features/auth/components/RouteGuards'
import MyProfilePage from './features/profile/pages/MyProfilePage'
import MySchedulePage from './features/timetable/pages/MySchedulePage'
import LoginPage from './features/auth/pages/LoginPage'
import LogoutPage from './features/auth/pages/LogoutPage'
import VerifyPage from './features/auth/pages/VerifyPage'
import DashboardPage from './features/dashboard/pages/DashboardPage'
import AbsenceListPage from './features/substitutions/pages/AbsenceListPage'
import DailyBoardPage from './features/substitutions/pages/DailyBoardPage'
import FindSubstitutesPage from './features/substitutions/pages/FindSubstitutesPage'
import AppealsReviewPage from './features/substitutions/pages/AppealsReviewPage'
import BreakMatrixPage from './features/substitutions/pages/BreakMatrixPage'
import AnalyticsPage from './features/substitutions/pages/AnalyticsPage'
import LessonsDashboardPage from './features/resource-management/lessons/pages/LessonsDashboardPage'
import LessonCreatePage from './features/resource-management/lessons/pages/LessonCreatePage'
import LessonDeletePage from './features/resource-management/lessons/pages/LessonDeletePage'
import LessonDetailsPage from './features/resource-management/lessons/pages/LessonDetailsPage'
import LessonEditPage from './features/resource-management/lessons/pages/LessonEditPage'
import ImportJobsPage from './features/system/pages/ImportJobsPage'
import DataImportPage from './features/system/pages/DataImportPage'
import BackupPage from './features/system/pages/BackupPage'
import ConstraintsOverviewPage from './features/system/pages/ConstraintsOverviewPage'
import PendingApprovalsPage from './features/system/pages/PendingApprovalsPage'
import EntityDepartmentsPage from './features/resource-management/departments/pages/DepartmentsPage'
import EntityPeriodsPage from './features/resource-management/periods/pages/PeriodsPage'
import EntityRoomsPage from './features/resource-management/rooms/pages/RoomsPage'
import EntitySchoolYearsPage from './features/resource-management/school-years/pages/SchoolYearsPage'
import EntityStudentsPage from './features/resource-management/students/pages/StudentsPage'
import EntitySubjectsPage from './features/resource-management/subjects/pages/SubjectsPage'
import EntityTeachersPage from './features/resource-management/teachers/pages/TeachersPage'
import EntityUsersPage from './features/resource-management/users/pages/UsersPage'
import EntityClassesPage from './features/resource-management/classes/pages/ClassesPage'
import MySubstitutionsPage from './features/substitutions/pages/MySubstitutionsPage'
import TimetableBatchPrintPage from './features/timetable/pages/TimetableBatchPrintPage'
import TimetableComparePage from './features/timetable/pages/TimetableComparePage'
import TimetableEditorPage from './features/timetable/pages/TimetableEditorPage'
import TimetableListPage from './features/timetable/pages/TimetableListPage'
import TimetablePrintPage from './features/timetable/pages/TimetablePrintPage'
import RunHistoryPage from './features/scheduling/pages/RunHistoryPage'
import GenerationLauncherPage from './features/scheduling/pages/GenerationLauncherPage'
import GenerationProgressPage from './features/scheduling/pages/GenerationProgressPage'
import OptimiseTimetablePage from './features/scheduling/pages/OptimiseTimetablePage'
import ResourceManagementPage from './features/resource-management/pages/ResourceManagementPage'

function App() {
  return (
    <Routes>
      <Route
        path="auth/login"
        element={
          <RequireGuest>
            <LoginPage />
          </RequireGuest>
        }
      />
      <Route
        path="auth/verify"
        element={
          <RequireGuest>
            <VerifyPage />
          </RequireGuest>
        }
      />
      <Route
        path="auth/logout"
        element={
          <RequireAuth>
            <LogoutPage />
          </RequireAuth>
        }
      />

      <Route path="login" element={<Navigate to="/auth/login" replace />} />
      <Route path="verify" element={<Navigate to="/auth/verify" replace />} />
      <Route path="logout" element={<Navigate to="/auth/logout" replace />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<RoleHomeRedirect />} />

        {/* Own-data views: teachers and students see only their published schedule;
            teachers additionally manage their own profile */}
        <Route
          path="my/schedule"
          element={
            <RequireRole roles={['Teacher', 'Student']}>
              <MySchedulePage />
            </RequireRole>
          }
        />
        <Route
          path="my/profile"
          element={
            <RequireRole roles={['Teacher']}>
              <MyProfilePage />
            </RequireRole>
          }
        />
        {/* Teacher self-service: their own assigned substitutions + appeal flow */}
        <Route
          path="substitutions/mine"
          element={
            <RequireRole roles={['Teacher']}>
              <MySubstitutionsPage />
            </RequireRole>
          }
        />

        {/* Everything below is operator/admin tooling — Admin role only.
            The API enforces the same restriction server-side. */}
        <Route element={<RequireRole roles={['Admin']}><Outlet /></RequireRole>}>
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="timetable" element={<TimetableListPage />} />
          <Route path="timetable/:id/edit" element={<TimetableEditorPage />} />
          <Route path="timetable/compare" element={<TimetableComparePage />} />
          <Route path="timetable/print" element={<TimetablePrintPage />} />
          <Route
            path="timetable/print/batch"
            element={<TimetableBatchPrintPage />}
          />

          <Route path="scheduling" element={<RunHistoryPage />} />
          <Route path="scheduling/launch" element={<GenerationLauncherPage />} />
          <Route path="scheduling/optimise" element={<OptimiseTimetablePage />} />
          <Route path="scheduling/runs/:runId" element={<GenerationProgressPage />} />

          <Route path="resource-management" element={<ResourceManagementPage />} />
          <Route path="resource-management/lessons" element={<LessonsDashboardPage />} />
          <Route path="resource-management/lessons/new" element={<LessonCreatePage />} />
          <Route path="resource-management/lessons/:id" element={<LessonDetailsPage />} />
          <Route path="resource-management/lessons/:id/edit" element={<LessonEditPage />} />
          <Route path="resource-management/lessons/:id/delete" element={<LessonDeletePage />} />

          <Route path="resource-management/teachers" element={<EntityTeachersPage />} />
          <Route path="resource-management/classes" element={<EntityClassesPage />} />
          <Route path="resource-management/subjects" element={<EntitySubjectsPage />} />
          <Route path="resource-management/rooms" element={<EntityRoomsPage />} />
          <Route path="resource-management/periods" element={<EntityPeriodsPage />} />
          <Route path="resource-management/departments" element={<EntityDepartmentsPage />} />
          <Route path="resource-management/school-years" element={<EntitySchoolYearsPage />} />
          <Route path="resource-management/students" element={<EntityStudentsPage />} />
          <Route path="resource-management/users" element={<EntityUsersPage />} />

          <Route path="substitutions" element={<AbsenceListPage />} />
          <Route path="substitutions/board" element={<DailyBoardPage />} />
          <Route path="substitutions/find" element={<FindSubstitutesPage />} />
          <Route path="substitutions/appeals" element={<AppealsReviewPage />} />
          <Route path="substitutions/break-duties" element={<BreakMatrixPage />} />
          <Route path="substitutions/analytics" element={<AnalyticsPage />} />

          <Route path="system" element={<ImportJobsPage />} />
          <Route path="system/import" element={<DataImportPage />} />
          <Route path="system/backup" element={<BackupPage />} />
          <Route path="system/constraints" element={<ConstraintsOverviewPage />} />
          <Route path="system/pending-users" element={<PendingApprovalsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<AuthFallbackRedirect />} />
    </Routes>
  )
}

export default App
