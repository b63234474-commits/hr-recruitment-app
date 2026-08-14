import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createInterview, getInterview, updateInterview } from '../services/interviewService';
import { getCandidate, getCandidates } from '../services/candidateService';
import { getJobs } from '../services/jobService';
import { getAssessments } from '../services/assessmentService';
import Layout from '../components/Layout';

const initialFormState = {
  candidate: '',
  job: '',
  assessment: '',
  interviewType: 'HR Interview',
  interviewer: '',
  interviewDate: '',
  startTime: '',
  endTime: '',
  meetingLink: '',
  location: '',
  notes: '',
  status: 'Scheduled',
};

const InterviewForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(initialFormState);
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);

  useEffect(() => {
    // Load dropdown lists
    const loadLists = async () => {
      try {
        const [candidatesRes, jobsRes, assessmentsRes] = await Promise.all([
          getCandidates(),
          getJobs(),
          getAssessments(),
        ]);
        setCandidates(candidatesRes.data.data.candidates || []);
        setJobs(jobsRes.data.data.jobs || []);
        setAssessments(assessmentsRes.data.data.assessments || []);
      } catch (err) {
        console.error('Error loading dropdown lists:', err);
      } finally {
        setLoadingLists(false);
      }
    };

    loadLists();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const candidateId = searchParams.get('candidateId');
    if (candidateId) {
      setForm((prev) => ({ ...prev, candidate: candidateId }));
      loadCandidate(candidateId);
    }

    if (isEdit) {
      loadInterview(id);
    }
  }, [id, isEdit, location.search]);

  const loadCandidate = async (candidateId) => {
    if (!candidateId) return;

    try {
      const response = await getCandidate(candidateId);
      const candidate = response.data.data.candidate;
      setCandidateName(`${candidate.firstName} ${candidate.lastName}`);
      if (!form.job && candidate.appliedJob?._id) {
        setForm((prev) => ({ ...prev, job: candidate.appliedJob._id }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load candidate');
    }
  };

  const loadInterview = async (interviewId) => {
    setLoading(true);
    setError('');
    try {
      const response = await getInterview(interviewId);
      const interview = response.data.data.interview;
      setForm({
        candidate: interview.candidate?._id || '',
        job: interview.job?._id || interview.job?.jobId || '',
        assessment: interview.assessment?._id || '',
        interviewType: interview.interviewType || 'HR Interview',
        interviewer: interview.interviewer || '',
        interviewDate: interview.interviewDate ? new Date(interview.interviewDate).toISOString().slice(0, 10) : '',
        startTime: interview.startTime || '',
        endTime: interview.endTime || '',
        meetingLink: interview.meetingLink || '',
        location: interview.location || '',
        notes: interview.notes || '',
        status: interview.status || 'Scheduled',
      });
      if (interview.candidate) {
        setCandidateName(`${interview.candidate.firstName} ${interview.candidate.lastName}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load interview');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'candidate') {
      setCandidateName('');
      setForm((prev) => ({ ...prev, candidate: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
      };
      if (isEdit) {
        await updateInterview(id, payload);
        setSuccess('Interview updated successfully');
      } else {
        await createInterview(payload);
        setSuccess('Interview scheduled successfully');
        setTimeout(() => navigate('/interviews'), 700);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">{isEdit ? 'Edit Interview' : 'Schedule Interview'}</h3>
          <p className="text-muted mb-0">
            {isEdit ? 'Update interview details and status.' : 'Create a new interview for a candidate.'}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {loadingLists && <div className="alert alert-info">Loading form data...</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Candidate</label>
                <select
                  className="form-select"
                  name="candidate"
                  value={form.candidate}
                  onChange={handleChange}
                  required
                  disabled={loadingLists}
                >
                  <option value="">Select a candidate</option>
                  {candidates.map((cand) => (
                    <option key={cand._id} value={cand._id}>
                      {cand.firstName} {cand.lastName} ({cand.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Job</label>
                <select
                  className="form-select"
                  name="job"
                  value={form.job}
                  onChange={handleChange}
                  disabled={loadingLists}
                >
                  <option value="">Select a job</option>
                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.jobTitle} ({job.department})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Assessment</label>
                <select
                  className="form-select"
                  name="assessment"
                  value={form.assessment}
                  onChange={handleChange}
                  disabled={loadingLists}
                >
                  <option value="">Select an assessment</option>
                  {assessments.map((assess) => (
                    <option key={assess._id} value={assess._id}>
                      {assess.name || assess.title} (ID: {assess._id.slice(-6)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Interview Type</label>
                <select
                  className="form-select"
                  name="interviewType"
                  value={form.interviewType}
                  onChange={handleChange}
                >
                  <option value="HR Interview">HR Interview</option>
                  <option value="Technical Interview">Technical Interview</option>
                  <option value="Manager Interview">Manager Interview</option>
                  <option value="Final Interview">Final Interview</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Interviewer</label>
                <input
                  type="text"
                  className="form-control"
                  name="interviewer"
                  value={form.interviewer}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Interview Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="interviewDate"
                  value={form.interviewDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-control"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-control"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Location / Meeting Link</label>
                <input
                  type="text"
                  className="form-control"
                  name="meetingLink"
                  value={form.meetingLink}
                  onChange={handleChange}
                  placeholder="Zoom or office location"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-control"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="No Show">No Show</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  name="notes"
                  rows="4"
                  value={form.notes}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
            <div className="mt-4 d-flex gap-2 flex-wrap">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Saving...
                  </>
                ) : (
                  isEdit ? 'Update Interview' : 'Schedule Interview'
                )}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/interviews')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default InterviewForm;
