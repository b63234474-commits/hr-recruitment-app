import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createJob, getJob, updateJob } from '../services/jobService';

const initialFormState = {
  jobId: '',
  jobTitle: '',
  department: '',
  location: '',
  employmentType: '',
  minimumExperience: 0,
  maximumExperience: 0,
  salaryRange: '',
  requiredSkills: '',
  preferredSkills: '',
  education: '',
  responsibilities: '',
  qualifications: '',
  jobDescription: '',
  numberOfOpenings: 1,
  recruiter: '',
  hiringManager: '',
  status: 'Draft',
  closingDate: '',
};

const JobForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isEdit) return;

    const loadJob = async () => {
      setLoading(true);
      try {
        const response = await getJob(id);
        const job = response.data.data.job;
        setForm({
          jobId: job.jobId || '',
          jobTitle: job.jobTitle || '',
          department: job.department || '',
          location: job.location || '',
          employmentType: job.employmentType || '',
          minimumExperience: job.minimumExperience || 0,
          maximumExperience: job.maximumExperience || 0,
          salaryRange: job.salaryRange || '',
          requiredSkills: (job.requiredSkills || []).join(', '),
          preferredSkills: (job.preferredSkills || []).join(', '),
          education: job.education || '',
          responsibilities: job.responsibilities || '',
          qualifications: job.qualifications || '',
          jobDescription: job.jobDescription || '',
          numberOfOpenings: job.numberOfOpenings || 1,
          recruiter: job.recruiter || '',
          hiringManager: job.hiringManager || '',
          status: job.status || 'Draft',
          closingDate: job.closingDate
            ? new Date(job.closingDate).toISOString().substring(0, 10)
            : '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load job data');
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        minimumExperience: Number(form.minimumExperience),
        maximumExperience: Number(form.maximumExperience),
        numberOfOpenings: Number(form.numberOfOpenings),
      };

      console.log('Submitting job payload:', payload);

      if (isEdit) {
        const response = await updateJob(id, payload);
        console.log('Job update response:', response.data);
        setSuccess('Job updated successfully');
        navigate(`/jobs/${id}`);
      } else {
        const response = await createJob(payload);
        console.log('Job create response:', response.data);
        setSuccess('Job created successfully');
        setTimeout(() => navigate('/jobs'), 700);
      }
    } catch (err) {
      console.error('Job save error:', err.response?.data || err.message || err);
      setError(
        err.response?.data?.message || err.message || 'Unable to save job'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">{isEdit ? 'Edit Job' : 'Create Job'}</h3>
          <p className="text-muted mb-0">
            {isEdit
              ? 'Update job details and status.'
              : 'Enter role details and create a new job posting.'}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Job Title</label>
                <input
                  type="text"
                  className="form-control"
                  name="jobTitle"
                  value={form.jobTitle}
                  onChange={handleChange}
                  required
                />
              </div>
              {isEdit && (
                <div className="col-md-6">
                  <label className="form-label">Job ID</label>
                  <input
                    type="text"
                    className="form-control"
                    name="jobId"
                    value={form.jobId}
                    readOnly
                    disabled
                  />
                </div>
              )}
              <div className="col-md-6">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="form-control"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-control"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Employment Type</label>
                <select
                  className="form-select"
                  name="employmentType"
                  value={form.employmentType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select employment type</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Min Exp</label>
                <input
                  type="number"
                  className="form-control"
                  name="minimumExperience"
                  value={form.minimumExperience}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Max Exp</label>
                <input
                  type="number"
                  className="form-control"
                  name="maximumExperience"
                  value={form.maximumExperience}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Salary Range</label>
                <input
                  type="text"
                  className="form-control"
                  name="salaryRange"
                  value={form.salaryRange}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Number of Openings</label>
                <input
                  type="number"
                  className="form-control"
                  name="numberOfOpenings"
                  value={form.numberOfOpenings}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Recruiter</label>
                <input
                  type="text"
                  className="form-control"
                  name="recruiter"
                  value={form.recruiter}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Hiring Manager</label>
                <input
                  type="text"
                  className="form-control"
                  name="hiringManager"
                  value={form.hiringManager}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  required
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Closing Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="closingDate"
                  value={form.closingDate}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Education</label>
                <input
                  type="text"
                  className="form-control"
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Required Skills</label>
                <input
                  type="text"
                  className="form-control"
                  name="requiredSkills"
                  value={form.requiredSkills}
                  onChange={handleChange}
                  placeholder="Comma-separated"
                />
              </div>
              <div className="col-12">
                <label className="form-label">Preferred Skills</label>
                <input
                  type="text"
                  className="form-control"
                  name="preferredSkills"
                  value={form.preferredSkills}
                  onChange={handleChange}
                  placeholder="Comma-separated"
                />
              </div>
              <div className="col-12">
                <label className="form-label">Job Description</label>
                <textarea
                  className="form-control"
                  name="jobDescription"
                  rows="4"
                  value={form.jobDescription}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              <div className="col-12">
                <label className="form-label">Responsibilities</label>
                <textarea
                  className="form-control"
                  name="responsibilities"
                  rows="3"
                  value={form.responsibilities}
                  onChange={handleChange}
                ></textarea>
              </div>
              <div className="col-12">
                <label className="form-label">Qualifications</label>
                <textarea
                  className="form-control"
                  name="qualifications"
                  rows="3"
                  value={form.qualifications}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            <div className="mt-4 d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Saving...
                  </>
                ) : (
                  isEdit ? 'Update Job' : 'Create Job'
                )}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/jobs')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JobForm;
