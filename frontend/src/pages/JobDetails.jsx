import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getJob, updateJob, deleteJob } from '../services/jobService';
import StatusBadge from '../components/StatusBadge';

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadJob = async () => {
      setLoading(true);
      try {
        const response = await getJob(id);
        setJob(response.data.data.job);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load job details');
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setError('');
    setSuccess('');
    try {
      await updateJob(id, { status: newStatus });
      setJob((prev) => ({ ...prev, status: newStatus }));
      setSuccess(`Job status updated to ${newStatus}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this job?')) return;

    try {
      await deleteJob(id);
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete job');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!job) {
    return <div className="alert alert-warning">Job not found.</div>;
  }

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex justify-content-between align-items-start mb-4 gap-3 flex-column flex-md-row">
        <div>
          <h3 className="mb-1">{job.jobTitle}</h3>
          <div className="text-muted">
            {job.department} · {job.location} · {job.employmentType}
          </div>
        </div>
        <div className="text-md-end">
          <StatusBadge status={job.status} />
          <div className="mt-3 d-flex gap-2 flex-wrap justify-content-end">
            <button type="button" className="btn btn-success btn-sm" onClick={() => navigate('/jobs')}>
              OK
            </button>
            <Link to={`/jobs/${id}/match-candidates`} className="btn btn-primary btn-sm">
              Match Candidates
            </Link>
            <Link to={`/jobs/${id}/edit`} className="btn btn-outline-secondary btn-sm">
              Edit Job
            </Link>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              Delete Job
            </button>
          </div>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Overview</h5>
              <dl className="row mb-0">
                <dt className="col-sm-4">Job ID</dt>
                <dd className="col-sm-8">{job.jobId}</dd>
                <dt className="col-sm-4">Openings</dt>
                <dd className="col-sm-8">{job.numberOfOpenings}</dd>
                <dt className="col-sm-4">Experience</dt>
                <dd className="col-sm-8">
                  {job.minimumExperience} - {job.maximumExperience} years
                </dd>
                <dt className="col-sm-4">Salary</dt>
                <dd className="col-sm-8">{job.salaryRange}</dd>
                <dt className="col-sm-4">Closing Date</dt>
                <dd className="col-sm-8">
                  {job.closingDate ? new Date(job.closingDate).toLocaleDateString() : 'N/A'}
                </dd>
              </dl>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Job Description</h5>
              <p className="mb-0 white-space-pre-line">{job.jobDescription}</p>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h6>Responsibilities</h6>
                  <p className="mb-0 white-space-pre-line">{job.responsibilities || 'Not provided'}</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h6>Qualifications</h6>
                  <p className="mb-0 white-space-pre-line">{job.qualifications || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Details</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <strong>Recruiter:</strong> {job.recruiter}
                </li>
                <li className="list-group-item">
                  <strong>Hiring Manager:</strong> {job.hiringManager}
                </li>
                <li className="list-group-item">
                  <strong>Education:</strong> {job.education || 'Not specified'}
                </li>
                <li className="list-group-item">
                  <strong>Required Skills:</strong>
                  <div>{job.requiredSkills?.join(', ') || 'None'}</div>
                </li>
                <li className="list-group-item">
                  <strong>Preferred Skills:</strong>
                  <div>{job.preferredSkills?.join(', ') || 'None'}</div>
                </li>
              </ul>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Actions</h5>
              <div className="d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-outline-success"
                  disabled={job.status === 'Active'}
                  onClick={() => handleStatusChange('Active')}
                >
                  Activate
                </button>
                <button
                  type="button"
                  className="btn btn-outline-warning"
                  disabled={job.status === 'Paused'}
                  onClick={() => handleStatusChange('Paused')}
                >
                  Pause
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  disabled={job.status === 'Closed'}
                  onClick={() => handleStatusChange('Closed')}
                >
                  Close Job
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={job.status === 'Active'}
                  onClick={() => handleStatusChange('Active')}
                >
                  Reopen Job
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
