import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getReports } from '../services/reportService';

const Reports = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    job: '',
    department: '',
    recruiter: '',
    source: '',
    status: '',
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getReports(filters);
      setReportData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = async (e) => {
    e.preventDefault();
    await fetchReports();
  };

  const handleReset = async () => {
    setFilters({ startDate: '', endDate: '', job: '', department: '', recruiter: '', source: '', status: '' });
    await fetchReports();
  };

  const exportCsv = () => {
    if (!reportData) return;
    const rows = ['Report Type,Label,Value'];
    reportData.candidateReport.statusCounts.forEach((item) => rows.push(`Candidate Status,${item.status},${item.count}`));
    reportData.candidateReport.sourceCounts.forEach((item) => rows.push(`Candidate Source,${item.source},${item.count}`));
    reportData.interviewReport.statusCounts.forEach((item) => rows.push(`Interview Status,${item.status},${item.count}`));
    reportData.offerReport.statusCounts.forEach((item) => rows.push(`Offer Status,${item.status},${item.count}`));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'recruitment-report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-start">
          <div>
            <h3 className="mb-1">Reports</h3>
            
          </div>
          <button className="btn btn-outline-secondary" onClick={exportCsv} disabled={!reportData}>
            <i className="bi bi-file-earmark-spreadsheet me-2"></i>
            Export CSV
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <form className="row g-3" onSubmit={handleFilterSubmit}>
            <div className="col-md-3">
              <label className="form-label">Start Date</label>
              <input type="date" name="startDate" className="form-control" value={filters.startDate} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label">End Date</label>
              <input type="date" name="endDate" className="form-control" value={filters.endDate} onChange={handleChange} />
            </div>
            <div className="col-md-2">
              <label className="form-label">Job</label>
              <input type="text" name="job" className="form-control" value={filters.job} onChange={handleChange} placeholder="Job ID or title" />
            </div>
            <div className="col-md-2">
              <label className="form-label">Department</label>
              <input type="text" name="department" className="form-control" value={filters.department} onChange={handleChange} placeholder="Department" />
            </div>
            <div className="col-md-2">
              <label className="form-label">Recruiter</label>
              <input type="text" name="recruiter" className="form-control" value={filters.recruiter} onChange={handleChange} placeholder="Recruiter" />
            </div>
            <div className="col-md-3">
              <label className="form-label">Candidate Source</label>
              <input type="text" name="source" className="form-control" value={filters.source} onChange={handleChange} placeholder="Source" />
            </div>
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <input type="text" name="status" className="form-control" value={filters.status} onChange={handleChange} placeholder="Status" />
            </div>
            <div className="col-12 d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
              <button type="submit" className="btn btn-primary">Apply Filters</button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : !reportData ? (
        <div className="alert alert-secondary">No report data available.</div>
      ) : (
        <>
          <div className="row g-4 mb-4">
            <div className="col-12 col-xl-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <p className="small text-muted mb-1">Candidates</p>
                  <h3>{reportData.summary.totalCandidates}</h3>
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <p className="small text-muted mb-1">Interviews</p>
                  <h3>{reportData.summary.totalInterviews}</h3>
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <p className="small text-muted mb-1">Offers</p>
                  <h3>{reportData.summary.totalOffers}</h3>
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <p className="small text-muted mb-1">Hires</p>
                  <h3>{reportData.summary.totalHires}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-xl-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="mb-3">Candidate Report</h5>
                  <ul className="list-group list-group-flush">
                    {reportData.candidateReport.statusCounts.map((item) => (
                      <li key={item.status} className="list-group-item d-flex justify-content-between align-items-center">
                        {item.status}
                        <span className="badge bg-primary rounded-pill">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="mb-3">Interview Report</h5>
                  <ul className="list-group list-group-flush">
                    {reportData.interviewReport.statusCounts.map((item) => (
                      <li key={item.status} className="list-group-item d-flex justify-content-between align-items-center">
                        {item.status}
                        <span className="badge bg-info rounded-pill">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="mb-3">Offer Report</h5>
                  <ul className="list-group list-group-flush">
                    {reportData.offerReport.statusCounts.map((item) => (
                      <li key={item.status} className="list-group-item d-flex justify-content-between align-items-center">
                        {item.status}
                        <span className="badge bg-secondary rounded-pill">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-4">
            <div className="col-12 col-xl-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="mb-3">Source Report</h5>
                  <div className="list-group list-group-flush">
                    {reportData.sourceReport.map((item) => (
                      <div key={item.source} className="list-group-item d-flex justify-content-between align-items-center">
                        {item.source}
                        <span className="badge bg-success rounded-pill">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="mb-3">Recruitment Funnel</h5>
                  <ul className="list-group list-group-flush">
                    {reportData.funnel.map((item) => (
                      <li key={item.label} className="list-group-item d-flex justify-content-between align-items-center">
                        {item.label}
                        <span className="badge bg-dark rounded-pill">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-4">
            <div className="col-12 col-xl-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="mb-3">Applications per Month</h5>
                  <ul className="list-group list-group-flush">
                    {reportData.charts.applicationsByMonth.map((item) => (
                      <li key={item.month} className="list-group-item d-flex justify-content-between align-items-center">
                        {item.month}
                        <span className="badge bg-primary rounded-pill">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="mb-3">Interviews per Month</h5>
                  <ul className="list-group list-group-flush">
                    {reportData.charts.interviewsByMonth.map((item) => (
                      <li key={item.month} className="list-group-item d-flex justify-content-between align-items-center">
                        {item.month}
                        <span className="badge bg-info rounded-pill">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-4">
            <div className="col-12 col-xl-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="mb-3">Offers per Month</h5>
                  <ul className="list-group list-group-flush">
                    {reportData.charts.offersByMonth.map((item) => (
                      <li key={item.month} className="list-group-item d-flex justify-content-between align-items-center">
                        {item.month}
                        <span className="badge bg-secondary rounded-pill">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="mb-3">Hires per Month</h5>
                  <ul className="list-group list-group-flush">
                    {reportData.charts.hiresByMonth.map((item) => (
                      <li key={item.month} className="list-group-item d-flex justify-content-between align-items-center">
                        {item.month}
                        <span className="badge bg-success rounded-pill">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Reports;
