import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobsList from './pages/JobsList';
import JobForm from './pages/JobForm';
import JobDetails from './pages/JobDetails';
import JobMatchCandidates from './pages/JobMatchCandidates';
import CandidatesList from './pages/CandidatesList';
import CandidateForm from './pages/CandidateForm';
import CandidateDetails from './pages/CandidateDetails';
import PipelineBoard from './pages/PipelineBoard';
import InterviewsList from './pages/InterviewsList';
import InterviewForm from './pages/InterviewForm';
import InterviewDetails from './pages/InterviewDetails';
import Offers from './pages/Offers';
import OfferForm from './pages/OfferForm';
import OfferDetails from './pages/OfferDetails';
import EmployeesList from './pages/EmployeesList';
import EmployeeForm from './pages/EmployeeForm';
import EmployeeDetails from './pages/EmployeeDetails';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AssessmentsList from './pages/AssessmentsList';
import AssessmentForm from './pages/AssessmentForm';
import AssessmentDetails from './pages/AssessmentDetails';
import PartnerForm from './pages/PartnerForm';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/create"
            element={
              <ProtectedRoute>
                <JobForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:id/edit"
            element={
              <ProtectedRoute>
                <JobForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:id"
            element={
              <ProtectedRoute>
                <JobDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:id/match-candidates"
            element={
              <ProtectedRoute>
                <JobMatchCandidates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidates"
            element={
              <ProtectedRoute>
                <CandidatesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidates/create"
            element={
              <ProtectedRoute>
                <CandidateForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidates/:id/edit"
            element={
              <ProtectedRoute>
                <CandidateForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidates/:id"
            element={
              <ProtectedRoute>
                <CandidateDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partners/add"
            element={
              <ProtectedRoute>
                <PartnerForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pipeline"
            element={
              <ProtectedRoute>
                <PipelineBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments"
            element={
              <ProtectedRoute>
                <AssessmentsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/create"
            element={
              <ProtectedRoute>
                <AssessmentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:id/edit"
            element={
              <ProtectedRoute>
                <AssessmentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:id"
            element={
              <ProtectedRoute>
                <AssessmentDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews"
            element={
              <ProtectedRoute>
                <InterviewsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews/create"
            element={
              <ProtectedRoute>
                <InterviewForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews/:id/edit"
            element={
              <ProtectedRoute>
                <InterviewForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews/:id"
            element={
              <ProtectedRoute>
                <InterviewDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/offers"
            element={
              <ProtectedRoute>
                <Offers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/offers/create"
            element={
              <ProtectedRoute>
                <OfferForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/offers/:id/edit"
            element={
              <ProtectedRoute>
                <OfferForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/offers/:id"
            element={
              <ProtectedRoute>
                <OfferDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <EmployeesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/create"
            element={
              <ProtectedRoute>
                <EmployeeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:id/edit"
            element={
              <ProtectedRoute>
                <EmployeeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <ProtectedRoute>
                <EmployeeDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
