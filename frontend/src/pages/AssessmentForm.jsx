import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createAssessment, getAssessment, updateAssessment } from '../services/assessmentService';
import { getCandidates } from '../services/candidateService';
import { getJobs } from '../services/jobService';
import Layout from '../components/Layout';

const AssessmentForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const candidateQuery = searchParams.get('candidateId');
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    candidate: candidateQuery || '',
    job: '',
    title: '',
    description: '',
    assessmentType: 'Technical',
    assignedTo: '',
    dueDate: '',
    status: 'Pending',
    score: '',
    result: 'Hold',
    feedback: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadFormData = async () => {
      setLoading(true);
      try {
        const [candidateResponse, jobResponse] = await Promise.all([
          getCandidates({ limit: 200 }),
          getJobs({ limit: 200 }),
        ]);
        setCandidates(candidateResponse.data.data.candidates || []);
        setJobs(jobResponse.data.data.jobs || []);

        if (isEdit) {
          const assessmentResponse = await getAssessment(id);
          const assessment = assessmentResponse.data.data.assessment;
          setForm({
            candidate: assessment.candidate?._id || '',
            job: assessment.job?._id || '',
            title: assessment.title || '',
            description: assessment.description || '',
            assessmentType: assessment.assessmentType || 'Technical',
            assignedTo: assessment.assignedTo || '',
            dueDate: assessment.dueDate ? assessment.dueDate.slice(0, 10) : '',
            status: assessment.status || 'Pending',
            score: assessment.score ?? '',
            result: assessment.result || 'Hold',
            feedback: assessment.feedback || '',
          });
        } else if (candidateQuery) {
          setForm((prev) => ({ ...prev, candidate: candidateQuery }));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assessment form data');
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [id, isEdit, candidateQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = {
        ...form,
        score: form.score !== '' ? Number(form.score) : undefined,
        dueDate: form.dueDate || undefined,
      };

      if (isEdit) {
        await updateAssessment(id, payload);
        setSuccess('Assessment updated successfully');
      } else {
        await createAssessment(payload);
        setSuccess('Assessment created successfully');
        setTimeout(() => navigate('/assessments'), 700);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save assessment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">{isEdit ? 'Edit Assessment' : 'Create Assessment'}</h3>
          <p className="text-muted mb-0">
            {isEdit
              ? 'Update assessment details, scoring, and result.'
              : 'Assign a new assessment to a candidate.'}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Candidate</label>
                  <select
                    className="form-select"
                    name="candidate"
                    value={form.candidate}
                    onChange={handleChange}
                    required
                    disabled={isEdit}
                  >
                    <option value="">Select candidate</option>
                    {candidates.map((candidate) => (
                      <option key={candidate._id} value={candidate._id}>
                        {candidate.firstName} {candidate.lastName} ({candidate.source})
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
                  >
                    <option value="">Use candidate applied job</option>
                    {jobs.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.jobTitle} ({job.jobId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Assessment Type</label>
                  <select
                    className="form-select"
                    name="assessmentType"
                    value={form.assessmentType}
                    onChange={handleChange}
                  >
                    <option value="Technical">Technical</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="Coding">Coding</option>
                    <option value="Case Study">Case Study</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Assigned To</label>
                  <input
                    type="text"
                    className="form-control"
                    name="assignedTo"
                    value={form.assignedTo}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Score</label>
                  <input
                    type="number"
                    className="form-control"
                    name="score"
                    value={form.score}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Result</label>
                  <select
                    className="form-select"
                    name="result"
                    value={form.result}
                    onChange={handleChange}
                  >
                    <option value="Hold">Hold</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Assigned By</label>
                  <input
                    type="text"
                    className="form-control"
                    name="assignedBy"
                    value="Current user"
                    disabled
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Feedback</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    name="feedback"
                    value={form.feedback}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/assessments')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : isEdit ? 'Update Assessment' : 'Create Assessment'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AssessmentForm;
