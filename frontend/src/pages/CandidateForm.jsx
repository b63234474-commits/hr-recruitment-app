import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  createCandidate,
  getCandidate,
  updateCandidate,
  uploadResume,
  uploadCandidateImage,
} from '../services/candidateService';
import { getJobs } from '../services/jobService';
import { getResumeUrl } from '../utils/urlHelper';

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  experience: '',
  currentCompany: '',
  currentDesignation: '',
  source: '',
  appliedJob: '',
  referredEmployeeName: '',
  partner: '',
  partnerName: '',
  education: '',
  resumeUrl: '',
  resumeFilename: '',
  imageUrl: '',
  imageFilename: '',
};

const CandidateForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const location = useLocation();
  const [form, setForm] = useState(initialFormState);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();

  // Load available jobs for appliedJob dropdown
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await getJobs({ limit: 100 });
        setJobs(response.data.data.jobs || []);
      } catch (err) {
        console.error('Unable to load jobs:', err);
      }
    };
    loadJobs();
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    const loadCandidate = async () => {
      setLoading(true);
      try {
        const response = await getCandidate(id);
        const candidate = response.data.data.candidate;
        setForm({
          firstName: candidate.firstName || '',
          lastName: candidate.lastName || '',
          email: candidate.email || '',
          phone: candidate.phone || '',
          location: candidate.location || '',
          experience: candidate.experience || '',
          currentCompany: candidate.currentCompany || '',
          currentDesignation: candidate.currentDesignation || '',
          referredEmployeeName: candidate.referredEmployeeName || '',
          source: candidate.source || '',
          appliedJob: candidate.appliedJob?.jobId || '',
          partner: candidate.partner?._id || '',
          partnerName: candidate.partner?.companyName || '',
          education: candidate.education || '',
          resumeUrl: candidate.resumeUrl || '',
          resumeFilename: candidate.resumeFilename || '',
          imageUrl: candidate.imageUrl || '',
          imageFilename: candidate.imageFilename || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load candidate data');
      } finally {
        setLoading(false);
      }
    };

    loadCandidate();
  }, [id, isEdit]);

  useEffect(() => {
    if (location.state?.candidateData) {
      setForm((prev) => ({
        ...prev,
        ...location.state.candidateData,
      }));
    }

    if (location.state?.selectedPartnerId) {
      setForm((prev) => ({
        ...prev,
        partner: location.state.selectedPartnerId,
        partnerName: location.state.selectedPartnerName || prev.partnerName,
      }));
    }
  }, [location.state]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await uploadResume(formData);
      const { parsed, resumeUrl, resumeFilename } = response.data.data;
      setForm((prev) => ({
        ...prev,
        ...parsed,
        resumeUrl,
        resumeFilename,
      }));
      setSuccess('Resume parsed successfully. Please review and save.');
    } catch (err) {
      setError(err.response?.data?.message || 'Resume upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await uploadCandidateImage(formData);
      const { imageUrl, imageFilename } = response.data.data;
      setForm((prev) => ({
        ...prev,
        imageUrl,
        imageFilename,
      }));
      setSuccess('Candidate image uploaded successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Candidate image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { partnerName, ...formData } = form;
      const payload = {
        ...formData,
        appliedJob: form.appliedJob || undefined,
        partner: form.partner || undefined,
      };

      if (isEdit) {
        await updateCandidate(id, payload);
        setSuccess('Candidate updated successfully');
        navigate(`/candidates/${id}`);
      } else {
        await createCandidate(payload);
        setSuccess('Candidate created successfully');
        setTimeout(() => navigate('/candidates'), 700);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="mb-1">{isEdit ? 'Edit Candidate' : 'Add Candidate'}</h3>
          <p className="text-muted mb-0">
            {isEdit
              ? 'Update candidate profile and resume details.'
              : 'Upload a resume or enter candidate details manually.'}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-start">
                <div>
                  <h5 className="card-title mb-2">Candidate details</h5>
                  <p className="text-muted mb-0">Organize the candidate profile with clean sections and easy-to-read fields.</p>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <label className="btn btn-outline-primary mb-0">
                    Upload Resume
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      hidden
                    />
                  </label>
                  <label className="btn btn-outline-info mb-0">
                    Upload Image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleImageUpload}
                      hidden
                    />
                  </label>
                  <span className="badge bg-secondary align-self-center">
                    {uploading ? 'Uploading...' : form.resumeFilename || 'No file uploaded'}
                  </span>
                </div>
              </div>
              <div className="mt-3 small text-muted">Accepted formats: PDF, DOC, DOCX. Parsed resume fields can be reviewed and saved.</div>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h6 className="text-uppercase text-muted mb-3">Personal Information</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h6 className="text-uppercase text-muted mb-3">Career & Job Details</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Current Company</label>
                  <input
                    type="text"
                    className="form-control"
                    name="currentCompany"
                    value={form.currentCompany}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Referral Employee Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="referredEmployeeName"
                    value={form.referredEmployeeName}
                    onChange={handleChange}
                    placeholder="Enter referring employee"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Partner Company</label>
                  <div className="d-flex flex-column gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() =>
                        navigate('/partners/add', {
                          state: {
                            returnTo: location.pathname,
                            candidateData: form,
                            selectedPartnerId: form.partner,
                            selectedPartnerName: form.partnerName,
                          },
                        })
                      }
                    >
                      + Add Partner
                    </button>
                    {form.partnerName ? (
                      <span className="badge bg-secondary">Selected: {form.partnerName}</span>
                    ) : (
                      <span className="text-muted">No partner selected</span>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    className="form-control"
                    name="currentDesignation"
                    value={form.currentDesignation}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Experience</label>
                  <input
                    type="text"
                    className="form-control"
                    name="experience"
                    value={form.experience}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Source</label>
                  <select
                    className="form-select"
                    name="source"
                    value={form.source}
                    onChange={handleChange}
                  >
                    <option value="">Select source</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Indeed">Indeed</option>
                    <option value="Naukri">Naukri</option>
                    <option value="Referral">Referral</option>
                    <option value="Company Website">Company Website</option>
                    <option value="Email">Email</option>
                    <option value="Recruiter Sourcing">Recruiter Sourcing</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Applied Job</label>
                  <select
                    className="form-select"
                    name="appliedJob"
                    value={form.appliedJob}
                    onChange={handleChange}
                  >
                    <option value="">Select a job</option>
                    {jobs.map((job) => (
                      <option key={job._id} value={job.jobId}>
                        {job.jobTitle} ({job.jobId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Resume Filename</label>
                  <input
                    type="text"
                    className="form-control"
                    name="resumeFilename"
                    value={form.resumeFilename}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h6 className="text-uppercase text-muted mb-3">Education</h6>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Education</label>
                  <input
                    type="text"
                    className="form-control"
                    name="education"
                    value={form.education}
                    onChange={handleChange}
                    placeholder="e.g., Bachelor of Science in Computer Science"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h6 className="card-title">Preview</h6>
              <div className="d-flex align-items-center gap-3 mb-3">
                {form.imageUrl ? (
                  <img
                    src={getResumeUrl(form.imageUrl)}
                    alt="Candidate"
                    className="rounded-circle border"
                    style={{ width: 56, height: 56, objectFit: 'cover' }}
                  />
                ) : (
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                    <span className="fs-5 fw-bold">{(form.firstName?.[0] || 'C') + (form.lastName?.[0] || '')}</span>
                  </div>
                )}
                <div>
                  <div className="fw-semibold">{form.firstName || 'First'} {form.lastName || 'Last'}</div>
                  <div className="text-muted small">{form.currentDesignation || 'Candidate Title'}</div>
                </div>
              </div>
              <div className="small text-uppercase text-muted mb-2">Contact</div>
              <p className="mb-2"><strong>Email:</strong> {form.email || '-'}</p>
              <p className="mb-2"><strong>Phone:</strong> {form.phone || '-'}</p>
              <p className="mb-2"><strong>Location:</strong> {form.location || '-'}</p>
              <hr />
              <div className="small text-uppercase text-muted mb-2">Job details</div>
              <p className="mb-2"><strong>Source:</strong> {form.source || '-'}</p>
              <p className="mb-2"><strong>Applied Job:</strong> {form.appliedJob || '-'}</p>
              <p className="mb-2"><strong>Resume:</strong> {form.resumeFilename || 'Not uploaded'}</p>
              <hr />
              <div className="small text-uppercase text-muted mb-2">Education</div>
              <p className="mb-2"><strong>Education:</strong> {form.education || '-'}</p>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Actions</h6>
              <p className="text-muted small mb-3">Save or review the candidate details after uploading a resume.</p>
              <div className="d-grid gap-2">
                <button type="submit" className="btn btn-primary" disabled={loading || uploading} onClick={handleSubmit}>
                  {loading ? 'Saving...' : isEdit ? 'Update Candidate' : 'Create Candidate'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/candidates')}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateForm;
