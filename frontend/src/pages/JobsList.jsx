import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, deleteJob } from '../services/jobService';
import StatusBadge from '../components/StatusBadge';
import Layout from '../components/Layout';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
 const [locationFilter, setLocationFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');

  const loadJobs = async (params = {}) => {
    setLoading(true);
    setError('');

    try {
      const response = await getJobs(params);
      setJobs(response.data.data.jobs);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => jobs, [jobs]);

  const handleSearch = async (e) => {
    e.preventDefault();
    await loadJobs({
      search,
      status: statusFilter,
      department: departmentFilter,
      location: locationFilter,
      employmentType: employmentTypeFilter,
    });
  };

  const resetFilters = async () => {
    setSearch('');
    setStatusFilter('');
    setDepartmentFilter('');
    setLocationFilter('');
    setEmploymentTypeFilter('');
    await loadJobs();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job?')) {
      return;
    }

    try {
      await deleteJob(id);
      setJobs((prev) => prev.filter((job) => job._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete job');
    }
  };

  return (
    <Layout>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">Job Management</h3>
            <p className="text-muted mb-0">Manage open hiring roles and job lifecycle.</p>
          </div>
          <Link to="/jobs/create" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2"></i>
            Create Job
          </Link>
        </div>

        <div className="card mb-4">
        <div className="card-body">
          <form className="row g-3" onSubmit={handleSearch}>
            <div className="col-md-4">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, department, location"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-control"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                placeholder="Department"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Location</label>
              <input
                type="text"
                className="form-control"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Location"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Employment Type</label>
              <select
                className="form-select"
                value={employmentTypeFilter}
                onChange={(e) => setEmploymentTypeFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
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

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-4 text-center text-muted">No jobs found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Closing</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job._id}>
                      <td>
                        <Link to={`/jobs/${job._id}`} className="text-decoration-none fw-semibold">
                          {job.jobTitle || 'Untitled role'}
                        </Link>
                        <div className="small text-muted">
                          {job.jobId || 'ID N/A'} · {job.recruiter || 'No recruiter'}
                        </div>
                      </td>
                      <td>{job.department || '-'}</td>
                      <td>{job.location || '-'}</td>
                      <td>{job.employmentType || '-'}</td>
                      <td><StatusBadge status={job.status} /></td>
                      <td>{job.closingDate ? new Date(job.closingDate).toLocaleDateString() : '—'}</td>
                      <td className="text-end">
                        <Link to={`/jobs/${job._id}`} className="btn btn-sm btn-outline-primary me-2">
                          View
                        </Link>
                        <Link to={`/jobs/${job._id}/edit`} className="btn btn-sm btn-outline-secondary me-2">
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(job._id)}
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
    </div>
    </Layout>
  );
};

export default JobsList;
