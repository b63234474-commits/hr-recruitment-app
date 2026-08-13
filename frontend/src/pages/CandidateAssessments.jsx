import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCandidate } from '../services/candidateService';
import Layout from '../components/Layout';

const CandidateAssessments = () => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCandidate = async () => {
      setLoading(true);
      try {
        const response = await getCandidate(id);
        setCandidate(response.data.data.candidate);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load candidate details');
      } finally {
        setLoading(false);
      }
    };

    loadCandidate();
  }, [id]);

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

  return (
    <Layout>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">Assessments for {candidate.firstName} {candidate.lastName}</h3>
            <p className="text-muted mb-0">All assessments assigned to this candidate.</p>
          </div>
          <Link to={`/assessments/create?candidateId=${candidate._id}`} className="btn btn-primary">
            Assign Assessment
          </Link>
        </div>
        <div className="card">
          <div className="card-body">
            {candidate.assessments && candidate.assessments.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Result</th>
                      <th>Score</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidate.assessments.map((assessment) => (
                      <tr key={assessment._id}>
                        <td>{assessment.title}</td>
                        <td>{assessment.assessmentType}</td>
                        <td>{assessment.status}</td>
                        <td>{assessment.result}</td>
                        <td>{assessment.score ?? '-'}</td>
                        <td className="text-end">
                          <Link to={`/assessments/${assessment._id}`} className="btn btn-sm btn-outline-primary me-2">
                            View
                          </Link>
                          <Link to={`/assessments/${assessment._id}/edit`} className="btn btn-sm btn-outline-secondary">
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted">No assessments assigned yet.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CandidateAssessments;
