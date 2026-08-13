import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getCandidates } from '../services/candidateService';
import { getJobs } from '../services/jobService';
import { createOffer, getOffer, updateOffer } from '../services/offerService';

const initialForm = {
  candidateId: '', jobId: '', salary: '', benefits: '', joiningDate: '',
  employmentType: '', location: '', reportingManager: '', offerDate: '', expiryDate: '', status: 'Draft',
};

const OfferForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [candidateResponse, jobResponse] = await Promise.all([
          getCandidates({ limit: 200 }), getJobs({ limit: 200 }),
        ]);
        setCandidates(candidateResponse.data.data.candidates || []);
        setJobs(jobResponse.data.data.jobs || []);
        if (isEdit) {
          const response = await getOffer(id);
          const offer = response.data.data.offer;
          setForm({
            candidateId: offer.candidateId?._id || '', jobId: offer.jobId?._id || '', salary: offer.salary || '',
            benefits: offer.benefits || '', joiningDate: offer.joiningDate?.slice(0, 10) || '',
            employmentType: offer.employmentType || '', location: offer.location || '', reportingManager: offer.reportingManager || '',
            offerDate: offer.offerDate?.slice(0, 10) || '', expiryDate: offer.expiryDate?.slice(0, 10) || '', status: offer.status || 'Draft',
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load offer data');
      }
    };
    loadOptions();
  }, [id, isEdit]);

  const handleChange = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEdit) await updateOffer(id, form);
      else await createOffer(form);
      navigate('/offers');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h3 className="mb-1">{isEdit ? 'Edit Offer' : 'Create Offer'}</h3><p className="text-muted mb-0">Prepare and manage a candidate offer letter.</p></div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card"><div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6"><label className="form-label">Candidate</label><select className="form-select" name="candidateId" value={form.candidateId} onChange={handleChange} required><option value="">Select candidate</option>{candidates.map((candidate) => <option key={candidate._id} value={candidate._id}>{candidate.firstName} {candidate.lastName} {candidate.email ? `(${candidate.email})` : ''}</option>)}</select></div>
            <div className="col-md-6"><label className="form-label">Job</label><select className="form-select" name="jobId" value={form.jobId} onChange={handleChange} required><option value="">Select job</option>{jobs.map((job) => <option key={job._id} value={job._id}>{job.jobId} - {job.jobTitle}</option>)}</select></div>
            <div className="col-md-4"><label className="form-label">Salary</label><input className="form-control" name="salary" value={form.salary} onChange={handleChange} required placeholder="e.g. $85,000 per year" /></div>
            <div className="col-md-4"><label className="form-label">Joining Date</label><input type="date" className="form-control" name="joiningDate" value={form.joiningDate} onChange={handleChange} required /></div>
            <div className="col-md-4"><label className="form-label">Offer Expiry</label><input type="date" className="form-control" name="expiryDate" value={form.expiryDate} onChange={handleChange} required /></div>
            <div className="col-md-4"><label className="form-label">Employment Type</label><input className="form-control" name="employmentType" value={form.employmentType} onChange={handleChange} required /></div>
            <div className="col-md-4"><label className="form-label">Location</label><input className="form-control" name="location" value={form.location} onChange={handleChange} required /></div>
            <div className="col-md-4"><label className="form-label">Reporting Manager</label><input className="form-control" name="reportingManager" value={form.reportingManager} onChange={handleChange} required /></div>
            <div className="col-md-4"><label className="form-label">Offer Date</label><input type="date" className="form-control" name="offerDate" value={form.offerDate} onChange={handleChange} /></div>
            <div className="col-md-8"><label className="form-label">Benefits</label><textarea className="form-control" name="benefits" value={form.benefits} onChange={handleChange} rows="2" placeholder="Health insurance, bonus, leave..." /></div>
            <div className="col-md-4"><label className="form-label">Status</label><select className="form-select" name="status" value={form.status} onChange={handleChange}><option>Draft</option><option>Sent</option><option>Viewed</option><option>Accepted</option><option>Declined</option><option>Expired</option></select></div>
          </div>
          <div className="mt-4 d-flex gap-2"><button className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update Offer' : 'Create Offer'}</button><button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/offers')}>Cancel</button></div>
        </form>
      </div></div>
    </Layout>
  );
};

export default OfferForm;
