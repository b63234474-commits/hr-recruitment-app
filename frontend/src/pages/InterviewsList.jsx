import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteInterview, getInterviews } from '../services/interviewService';
import Layout from '../components/Layout';

const InterviewsList = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadInterviews = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const response = await getInterviews({ ...params, limit: 200 });
      setInterviews(response.data.data.interviews);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    await loadInterviews({ search, status: statusFilter });
  };

  const resetFilters = async () => {
    setSearch('');
    setStatusFilter('');
    await loadInterviews();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this interview?')) return;
    try {
      await deleteInterview(id);
      setInterviews((prev) => prev.filter((interview) => interview._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete interview');
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">Interviews</h3>
          <p className="text-muted mb-0">Track interview scheduling, feedback and status.</p>
        </div>
        <Link to="/interviews/create" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          Schedule Interview
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <form className="row g-3" onSubmit={handleSearch}>
            <div className="col-md-5">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Interviewer, location, candidate"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="No Show">No Show</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end gap-2">
              <button type="submit" className="btn btn-outline-primary w-100">
                Filter
              </button>
              <button type="button" className="btn btn-secondary w-100" onClick={resetFilters}>
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : interviews.length === 0 ? (
            <div className="p-4 text-center text-muted">No interviews found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Candidate</th>
                    <th>Job</th>
                    <th>Type</th>
                    <th>Interviewer</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((interview) => (
                    <tr key={interview._id}>
                      <td>{interview.interviewDate ? new Date(interview.interviewDate).toLocaleString() : '-'}</td>
                      <td>
                        {interview.candidate ? (
                          <Link to={`/candidates/${interview.candidate._id}`} className="text-decoration-none">
                            {interview.candidate.firstName} {interview.candidate.lastName}
                          </Link>
                        ) : 'Unknown'}
                      </td>
                      <td>{interview.job?.jobTitle || interview.job?.jobId || '-'}</td>
                      <td>{interview.interviewType}</td>
                      <td>{interview.interviewer || '-'}</td>
                      <td>{interview.status}</td>
                      <td className="text-end">
                        <Link to={`/interviews/${interview._id}`} className="btn btn-sm btn-outline-primary me-2">
                          View
                        </Link>
                        <Link to={`/interviews/${interview._id}/edit`} className="btn btn-sm btn-outline-secondary me-2">
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(interview._id)}
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

export default InterviewsList;
