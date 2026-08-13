import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAssessment, deleteAssessment } from '../services/assessmentService';
import Layout from '../components/Layout';

const AssessmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssessment = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getAssessment(id);
        setAssessment(response.data.data.assessment);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load assessment');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this assessment?')) return;

    try {
      await deleteAssessment(id);
      navigate('/assessments');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete assessment');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="alert alert-danger">{error}</div>
      </Layout>
    );
  }

  if (!assessment) {
    return (
      <Layout>
        <div className="alert alert-warning">Assessment not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-start mb-4 gap-3 flex-column flex-md-row">
        <div>
          <h3 className="mb-1">{assessment.title}</h3>
          <p className="text-muted mb-0">Assessment details and workflow for candidate review.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to={`/assessments/${id}/edit`} className="btn btn-outline-secondary">
            Edit
          </Link>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Overview</h5>
              <dl className="row mb-0">
                <dt className="col-sm-4">Candidate</dt>
                <dd className="col-sm-8">
                  {assessment.candidate ? (
                    <Link to={`/candidates/${assessment.candidate._id}`} className="text-decoration-none">
                      {assessment.candidate.firstName} {assessment.candidate.lastName}
                    </Link>
                  ) : 'Unknown'}
                </dd>
                <dt className="col-sm-4">Job</dt>
                <dd className="col-sm-8">
                  {assessment.job ? `${assessment.job.jobTitle} (${assessment.job.jobId})` : 'Unassigned'}
                </dd>
                <dt className="col-sm-4">Type</dt>
                <dd className="col-sm-8">{assessment.assessmentType}</dd>
                <dt className="col-sm-4">Status</dt>
                <dd className="col-sm-8">{assessment.status}</dd>
                <dt className="col-sm-4">Result</dt>
                <dd className="col-sm-8">{assessment.result}</dd>
                <dt className="col-sm-4">Score</dt>
                <dd className="col-sm-8">{assessment.score ?? '-'}</dd>
                <dt className="col-sm-4">Due Date</dt>
                <dd className="col-sm-8">{assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : '-'}</dd>
                <dt className="col-sm-4">Assigned To</dt>
                <dd className="col-sm-8">{assessment.assignedTo || '-'}</dd>
                <dt className="col-sm-4">Assigned By</dt>
                <dd className="col-sm-8">
                  {assessment.assignedBy ? `${assessment.assignedBy.firstName} ${assessment.assignedBy.lastName}` : '-'}
                </dd>
              </dl>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Description</h5>
              <p className="mb-0 white-space-pre-line">{assessment.description || 'No description provided.'}</p>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Feedback</h5>
              <p className="mb-0">{assessment.feedback || 'No feedback recorded.'}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Timestamps</h5>
              <ul className="list-unstyled mb-0">
                <li>
                  <strong>Created:</strong> {new Date(assessment.createdAt).toLocaleString()}
                </li>
                <li>
                  <strong>Updated:</strong> {new Date(assessment.updatedAt).toLocaleString()}
                </li>
                {assessment.completedAt && (
                  <li>
                    <strong>Completed:</strong> {new Date(assessment.completedAt).toLocaleString()}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AssessmentDetails;
