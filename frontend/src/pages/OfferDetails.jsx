import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { deleteOffer, downloadOfferPdf, getOffer, updateOfferStatus } from '../services/offerService';
import StatusBadge from '../components/StatusBadge';

const OfferDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOffer = async () => {
    try { const response = await getOffer(id); setOffer(response.data.data.offer); }
    catch (err) { setError(err.response?.data?.message || 'Unable to load offer'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadOffer(); }, [id]);

  const changeStatus = async (status) => {
    try {
      const response = await updateOfferStatus(id, status);
      setOffer(response.data.data.offer);
      window.dispatchEvent(new Event('dashboardUpdated'));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update offer status');
    }
  };

  const downloadPdf = async () => {
    try {
      const response = await downloadOfferPdf(id);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a'); link.href = url; link.download = `${offer.offerId}.pdf`; link.click(); URL.revokeObjectURL(url);
    } catch (err) { setError(err.response?.data?.message || 'Unable to generate PDF'); }
  };

  const removeOffer = async () => {
    if (!window.confirm('Delete this offer?')) return;
    try { await deleteOffer(id); navigate('/offers'); } catch (err) { setError(err.response?.data?.message || 'Unable to delete offer'); }
  };

  if (loading) return <Layout><div className="text-center py-5"><div className="spinner-border text-primary" /></div></Layout>;
  if (!offer) return <Layout><div className="alert alert-danger">{error || 'Offer not found'}</div></Layout>;
  const candidateName = `${offer.candidateId?.firstName || ''} ${offer.candidateId?.lastName || ''}`;
  const date = (value) => value ? new Date(value).toLocaleDateString() : '-';

  return <Layout>
    <div className="d-flex justify-content-between align-items-start mb-4 gap-3 flex-column flex-md-row"><div><h3 className="mb-1">Offer {offer.offerId}</h3><p className="text-muted mb-0">{candidateName} · {offer.jobId?.jobTitle}</p></div><StatusBadge status={offer.status} /></div>
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="row g-4">
      <div className="col-lg-8"><div className="card"><div className="card-body">
        <h5>Offer Preview</h5><hr /><h4>HR Recruitment Management System</h4><p>Dear {candidateName},</p><p>We are pleased to offer you the position of <strong>{offer.jobId?.jobTitle}</strong> in the {offer.jobId?.department} department.</p>
        <dl className="row"><dt className="col-sm-4">Salary</dt><dd className="col-sm-8">{offer.salary}</dd><dt className="col-sm-4">Benefits</dt><dd className="col-sm-8">{offer.benefits || '-'}</dd><dt className="col-sm-4">Joining date</dt><dd className="col-sm-8">{date(offer.joiningDate)}</dd><dt className="col-sm-4">Location</dt><dd className="col-sm-8">{offer.location}</dd><dt className="col-sm-4">Employment type</dt><dd className="col-sm-8">{offer.employmentType}</dd><dt className="col-sm-4">Reporting manager</dt><dd className="col-sm-8">{offer.reportingManager}</dd><dt className="col-sm-4">Offer expiry</dt><dd className="col-sm-8">{date(offer.expiryDate)}</dd></dl>
        <h6>Terms and Conditions</h6><p>This offer is subject to verification of the information provided during recruitment, completion of required documentation, and compliance with company policies.</p><p className="mb-0">Sincerely,<br /><strong>Authorized HR Signatory</strong></p>
      </div></div></div>
      <div className="col-lg-4"><div className="card"><div className="card-body"><h5>Actions</h5><div className="d-grid gap-2"><button className="btn btn-primary" onClick={downloadPdf}><i className="bi bi-file-earmark-pdf me-2" />Generate / Download PDF</button><button className="btn btn-outline-primary" disabled={offer.status === 'Sent'} onClick={() => changeStatus('Sent')}>Send Offer</button><button className="btn btn-outline-success" disabled={offer.status === 'Accepted'} onClick={() => changeStatus('Accepted')}>Accept</button><button className="btn btn-outline-danger" disabled={offer.status === 'Declined'} onClick={() => changeStatus('Declined')}>Decline</button><Link className="btn btn-outline-secondary" to={`/offers/${id}/edit`}>Edit Offer</Link><button className="btn btn-outline-dark" onClick={removeOffer}>Delete Offer</button></div></div></div></div>
    </div>
  </Layout>;
};

export default OfferDetails;
