import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssessments, deleteAssessment } from '../services/assessmentService';
import Layout from '../components/Layout';

const AssessmentsList = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAssessments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAssessments({ limit: 200 });
      setAssessments(response.data.data.assessments);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load assessments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assessment?')) return;

    try {
      await deleteAssessment(id);
      setAssessments((prev) => prev.filter((assessment) => assessment._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete assessment');
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">Assessments</h3>
          
        </div>
        <Link to="/assessments/create" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          Create Assessment
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : assessments.length === 0 ? (
            <div className="p-4 text-center text-muted">No assessments found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Candidate</th>
                    <th>Job</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Result</th>
                    <th>Score</th>
                    <th>Due Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((assessment) => (
                    <tr key={assessment._id}>
                      <td>{assessment.title}</td>
                      <td>
                        {assessment.candidate ? (
                          <Link to={`/candidates/${assessment.candidate._id}`} className="text-decoration-none">
                            {assessment.candidate.firstName} {assessment.candidate.lastName}
                          </Link>
                        ) : 'Unknown'}
                      </td>
                      <td>{assessment.job?.jobTitle || assessment.job?.jobId || '-'}</td>
                      <td>{assessment.assessmentType}</td>
                      <td>{assessment.status}</td>
                      <td>{assessment.result}</td>
                      <td>{assessment.score ?? '-'}</td>
                      <td>{assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="text-end">
                        <Link to={`/assessments/${assessment._id}`} className="btn btn-sm btn-outline-primary me-2">
                          View
                        </Link>
                        <Link to={`/assessments/${assessment._id}/edit`} className="btn btn-sm btn-outline-secondary me-2">
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(assessment._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AssessmentsList;
