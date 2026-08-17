import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCandidates, deleteCandidate } from '../services/candidateService';
import Layout from '../components/Layout';
import { getResumeUrl } from '../utils/urlHelper';

const CandidatesList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const loadCandidates = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const response = await getCandidates(params);
      setCandidates(response.data.data.candidates);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextSearch = params.get('search') || '';
    const nextStatus = params.get('status') || '';
    const nextPartner = params.get('partner') || '';

    setSearch(nextSearch);
    setStatusFilter(nextStatus);
    setPartnerFilter(nextPartner);

    loadCandidates({
      search: nextSearch,
      status: nextStatus,
      partner: nextPartner,
    });
  }, [location.search]);

  const sortedCandidates = useMemo(() => {
    const data = [...candidates];
    switch (sortBy) {
      case 'name-asc':
        data.sort((a, b) => `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`));
        break;
      case 'match-desc':
        data.sort((a, b) => Number(b.matchScore || 0) - Number(a.matchScore || 0));
        break;
      default:
        data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return data;
  }, [candidates, sortBy]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      search,
      status: statusFilter,
      partner: partnerFilter,
    });
    navigate(`/candidates?${params.toString()}`);
    await loadCandidates({
      search,
      status: statusFilter,
      partner: partnerFilter,
    });
  };

  const resetFilters = async () => {
    setSearch('');
    setStatusFilter('');
    setPartnerFilter('');
    setSortBy('newest');
    navigate('/candidates');
    await loadCandidates();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this candidate?')) return;
    try {
      await deleteCandidate(id);
      setCandidates((prev) => prev.filter((candidate) => candidate._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete candidate');
    }
  };

  return (
    <Layout>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">Candidates</h3>
           
          </div>
          <Link to="/candidates/create" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2"></i>
            Add Candidate
          </Link>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <form className="row g-3" onSubmit={handleSearch}>
              <div className="col-md-4">
                <label className="form-label">Search Candidates</label>
                <input
                  type="text"
                  className="form-control"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or job"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Partner Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={partnerFilter}
                  onChange={(e) => setPartnerFilter(e.target.value)}
                  placeholder="Filter by partner"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="New">New</option>
                  <option value="Screening">Screening</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Assessment">Assessment</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                  <option value="Interview Completed">Interview Completed</option>
                  <option value="Selected">Selected</option>
                  <option value="Offer Draft">Offer Draft</option>
                  <option value="Offer Sent">Offer Sent</option>
                  <option value="Offer Accepted">Offer Accepted</option>
                  <option value="Hired">Hired</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Sort</label>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="name-asc">Name A–Z</option>
                  <option value="match-desc">Highest Match</option>
                </select>
              </div>
              <div className="col-md-12 d-flex gap-2 justify-content-end">
                <button type="submit" className="btn btn-outline-primary">
                  Search
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetFilters}>
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
          ) : candidates.length === 0 ? (
            <div className="p-4 text-center text-muted">No candidates found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Applied Role</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCandidates.map((candidate) => (
                    <tr key={candidate._id} className="align-middle">
                      <td className="align-middle">
                        <div className="d-flex align-items-center gap-3">
                          {candidate.imageUrl ? (
                            <img
                              src={getResumeUrl(candidate.imageUrl)}
                              alt={`${candidate.firstName} ${candidate.lastName}`}
                              className="rounded-circle border"
                              style={{ width: 32, height: 32, objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                              style={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              {(candidate.firstName?.[0] || 'C') + (candidate.lastName?.[0] || '')}
                            </div>
                          )}
                          <Link to={`/candidates/${candidate._id}`} className="text-decoration-none fw-semibold">
                            {candidate.firstName} {candidate.lastName}
                          </Link>
                        </div>
                      </td>
                      <td className="align-middle">
                        <div>{candidate.email || '-'}</div>
                        <div className="small text-muted">{candidate.phone || '-'}</div>
                      </td>
                      <td className="align-middle">
                        <div>{candidate.appliedJob?.jobId || '-'}</div>
                        <div className="small text-muted">{candidate.appliedJob?.title || candidate.appliedJob?.jobTitle || ''}</div>
                      </td>
                      <td className="align-middle">{candidate.status || 'New'}</td>
                      <td className="text-end align-middle">
                        <div className="d-flex justify-content-end align-items-center gap-2">
                          <Link to={`/candidates/${candidate._id}`} className="btn btn-sm btn-outline-primary">
                            View
                          </Link>
                          <Link to={`/candidates/${candidate._id}/edit`} className="btn btn-sm btn-outline-secondary">
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(candidate._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default CandidatesList;
