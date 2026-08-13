import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { getEmployees, deleteEmployee } from '../services/employeeService';

const EmployeesList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');

  const loadEmployees = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const response = await getEmployees(params);
      setEmployees(response.data.data.employees);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    await loadEmployees({
      search,
      onboardingStatus: statusFilter,
      department: departmentFilter,
      designation: designationFilter,
      manager: managerFilter,
    });
  };

  const resetFilters = async () => {
    setSearch('');
    setStatusFilter('');
    setDepartmentFilter('');
    setDesignationFilter('');
    setManagerFilter('');
    await loadEmployees();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((employee) => employee._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete employee');
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4 gap-3 flex-column flex-md-row">
        <div>
          <h3 className="mb-1">Employees</h3>
          <p className="text-muted mb-0">Track employees and onboarding progress.</p>
        </div>
        <Link to="/employees/create" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          Add Employee
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <form className="row g-3" onSubmit={handleSearch}>
            <div className="col-md-3">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, job"
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Documents Pending">Documents Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
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
              <label className="form-label">Designation</label>
              <input
                type="text"
                className="form-control"
                value={designationFilter}
                onChange={(e) => setDesignationFilter(e.target.value)}
                placeholder="Designation"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Manager</label>
              <input
                type="text"
                className="form-control"
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
                placeholder="Manager"
              />
            </div>
            <div className="col-12 d-flex gap-2 justify-content-end">
              <button type="submit" className="btn btn-outline-primary">Search</button>
              <button type="button" className="btn btn-secondary" onClick={resetFilters}>Reset</button>
            </div>
          </form>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">
              <div className="spinner-border text-primary" />
            </div>
          ) : employees.length === 0 ? (
            <div className="p-4 text-center text-muted">No employees found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Joining Date</th>
                    <th>Manager</th>
                    <th>Employment Type</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee._id}>
                      <td>{employee.employeeId}</td>
                      <td>
                        <Link to={`/employees/${employee._id}`} className="text-decoration-none">
                          {employee.firstName} {employee.lastName}
                        </Link>
                      </td>
                      <td>{employee.department || '-'}</td>
                      <td>{employee.designation || '-'}</td>
                      <td>{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : '-'}</td>
                      <td>{employee.manager || '-'}</td>
                      <td>{employee.employmentType || '-'}</td>
                      <td><StatusBadge status={employee.onboardingStatus || 'Pending'} /></td>
                      <td className="text-end">
                        <Link className="btn btn-sm btn-outline-secondary me-2" to={`/employees/${employee._id}`}>
                          View
                        </Link>
                        <Link className="btn btn-sm btn-outline-primary me-2" to={`/employees/${employee._id}/edit`}>
                          Edit
                        </Link>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(employee._id)}>
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

export default EmployeesList;
