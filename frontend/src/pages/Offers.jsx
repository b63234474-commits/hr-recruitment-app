import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getOffers } from '../services/offerService';
import { getCandidates } from '../services/candidateService';
import { getJobs } from '../services/jobService';
import StatusBadge from '../components/StatusBadge';

const OFFER_STATUSES = ['Draft', 'Sent', 'Viewed', 'Accepted', 'Declined', 'Expired'];

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [filters, setFilters] = useState({ search: '', candidate: '', job: '', status: '', date: '' });
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOffers = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const response = await getOffers(params);
      setOffers(response.data.data.offers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
    Promise.all([getCandidates({ limit: 200 }), getJobs({ limit: 200 })])
      .then(([candidateResponse, jobResponse]) => {
        setCandidates(candidateResponse.data.data.candidates || []);
        setJobs(jobResponse.data.data.jobs || []);
      })
      .catch(() => setError('Unable to load offer filters'));
  }, []);

  const submit = (event) => {
    event.preventDefault();
    loadOffers(filters);
  };

  const change = (event) => {
    setFilters((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">Offer Management</h3>
          
        </div>
        <Link to="/offers/create" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2" />Create Offer
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <form className="row g-3" onSubmit={submit}>
            <div className="col-md-5">
              <label className="form-label">Candidate or Job</label>
              <input className="form-control" name="search" value={filters.search} onChange={change} placeholder="Search offers" />
            </div>
            <div className="col-md-3">
              <label className="form-label">Candidate</label>
              <select className="form-select" name="candidate" value={filters.candidate} onChange={change}>
                <option value="">All candidates</option>
                {candidates.map((candidate) => <option key={candidate._id} value={candidate._id}>{candidate.firstName} {candidate.lastName}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Job</label>
              <select className="form-select" name="job" value={filters.job} onChange={change}>
                <option value="">All jobs</option>
                {jobs.map((job) => <option key={job._id} value={job._id}>{job.jobTitle}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={filters.status} onChange={change}>
                <option value="">All statuses</option>
                {OFFER_STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Offer Date</label>
              <input type="date" className="form-control" name="date" value={filters.date} onChange={change} />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-primary w-100">Filter</button>
            </div>
          </form>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center"><div className="spinner-border text-primary" /></div>
          ) : offers.length === 0 ? (
            <div className="p-4 text-center text-muted">No offers found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light"><tr><th>Offer ID</th><th>Candidate</th><th>Job</th><th>Offer Date</th><th>Joining Date</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
                <tbody>{offers.map((offer) => (
                  <tr key={offer._id}>
                    <td>{offer.offerId}</td>
                    <td>{offer.candidateId?.firstName} {offer.candidateId?.lastName}</td>
                    <td>{offer.jobId?.jobTitle || '-'}</td>
                    <td>{offer.offerDate ? new Date(offer.offerDate).toLocaleDateString() : '-'}</td>
                    <td>{offer.joiningDate ? new Date(offer.joiningDate).toLocaleDateString() : '-'}</td>
                    <td><StatusBadge status={offer.status} /></td>
                    <td className="text-end"><Link className="btn btn-sm btn-outline-primary" to={`/offers/${offer._id}`}>View</Link></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Offers;
