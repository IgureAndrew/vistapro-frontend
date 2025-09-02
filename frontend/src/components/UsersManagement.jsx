// src/components/UsersManagement.jsx
import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import ConfirmDialog from "./ui/confirm-dialog";
import { Sheet, SheetContent } from "./ui/sheet";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
// Removed sheet (unused after sidebar filters)
import { UserIcon } from "@heroicons/react/24/outline";
import { useToast } from "./ui/use-toast";

// List of Nigerian states for location selection.
const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue",
  "Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara","FCT"
];

function FiltersPanel({ serverFilters, setServerFilters, baseUrl, NIGERIAN_STATES }) {
  const set = (patch) => setServerFilters(s => ({ ...s, ...patch, page: 1 }));
  return (
    <div className="space-y-3">
      <Card className="bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription className="text-muted-foreground">Refine users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Search bar - full width on mobile */}
            <input
              type="text"
              placeholder="Search by name, email, ID or role"
              value={serverFilters.q}
              onChange={e => set({ q: e.target.value })}
              className="input-soft h-11 w-full"
            />
            
            {/* Filter controls - responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
              <select value={serverFilters.role} onChange={e => set({ role: e.target.value })} className="select-soft h-11 w-full">
                <option value="">All Roles</option>
                <option value="SuperAdmin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Marketer">Marketer</option>
                <option value="Dealer">Dealer</option>
              </select>
              <select value={serverFilters.status} onChange={e => set({ status: e.target.value })} className="select-soft h-11 w-full">
                <option value="">Any Status</option>
                <option value="active">Active</option>
                <option value="locked">Locked</option>
              </select>
              <select value={serverFilters.location} onChange={e => set({ location: e.target.value })} className="select-soft h-11 w-full">
                <option value="">All Locations</option>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={serverFilters.sort} onChange={e => set({ sort: e.target.value })} className="select-soft h-11 w-full">
                <option value="id">ID</option>
                <option value="first_name">First Name</option>
                <option value="last_name">Last Name</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
                <option value="location">Location</option>
                <option value="created_at">Created</option>
              </select>
              <select value={serverFilters.order} onChange={e => set({ order: e.target.value })} className="select-soft h-11 w-full">
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const params = new URLSearchParams({ ...serverFilters, format: 'csv' });
                  window.open(`${baseUrl}?${params.toString()}`, '_blank');
                }}
                className="btn-soft h-11 px-4 text-sm"
              >
                Export CSV
              </button>
              <button
                onClick={() =>
                  setServerFilters({
                    q: "", role: "", status: "", location: "",
                    sort: "id", order: "desc", page: 1, limit: serverFilters.limit || 10
                  })
                }
                className="btn-soft h-11 px-4 text-sm"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsersManagement() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteType, setDeleteType] = useState('soft'); // 'soft' or 'permanent'
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);
  const [confirmLockOpen, setConfirmLockOpen] = useState(false);
  const [lockUserId, setLockUserId] = useState(null);
  const [lockAction, setLockAction] = useState("lock"); // "lock" | "unlock"

  const [addFormData, setAddFormData] = useState({
    role: "", first_name: "", last_name: "", gender: "",
    email: "", password: "",
    bank_name: "", account_number: "", account_name: "",
    location: "",
    registered_business_name: "",
    registered_business_address: "",
    business_account_name: "",
    business_account_number: "",
    registrationCertificate: null,
  });

  const [editFormData, setEditFormData] = useState({
    role: "", first_name: "", last_name: "", gender: "",
    email: "", password: "",
    bank_name: "", account_number: "", account_name: "",
    location: "",
    registered_business_name: "",
    registered_business_address: "",
    business_account_name: "",
    business_account_number: "",
    registrationCertificate: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword(p => !p);

  // Force Advanced UI
  const advancedUsersUI = true;
  const [serverFilters, setServerFilters] = useState({
    q: "",
    role: "",
    status: "",
    location: "",
    sort: "id",
    order: "desc",
    page: 1,
    limit: 10,
  });
  const [serverPagination, setServerPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  // sheet state removed (no longer used)

  // Use the configured API base instead of hardcoding production URL
  const baseUrl = `${import.meta.env.VITE_API_URL}/api/master-admin/users`;
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (advancedUsersUI) {
      fetchUsersServer();
    } else {
      fetchUsersClient();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advancedUsersUI, serverFilters.page, serverFilters.limit, serverFilters.role, serverFilters.status, serverFilters.location, serverFilters.sort, serverFilters.order, showDeletedUsers]);

  async function fetchUsersClient() {
    try {
      const res = await fetch(baseUrl, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data.users);
      else setError(data.message || "Failed to fetch users");
    } catch (err) {
      console.error(err);
      setError("Error fetching users");
    }
  }

  async function fetchUsersServer() {
    try {
      const params = new URLSearchParams();
      const { q, role, status, location, page, limit, sort, order } = serverFilters;
      if (q) params.set('q', q);
      if (role) params.set('role', role);
      if (status) params.set('status', status);
      if (location) params.set('location', location);
      params.set('page', String(page || 1));
      params.set('limit', String(limit || 20));
      if (sort) params.set('sort', sort);
      if (order) params.set('order', order);
      
      // Include deleted users if toggle is on
      if (showDeletedUsers) {
        params.set('includeDeleted', 'true');
      }
      
      const url = `${baseUrl}?${params.toString()}`;
      const res = await fetch(url, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        if (data.pagination) setServerPagination(data.pagination);
      } else {
        setError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching users");
    }
  }

  function openAddUserModal() {
    setAddFormData({
      role: "", first_name: "", last_name: "", gender: "",
      email: "", password: "",
      bank_name: "", account_number: "", account_name: "",
      location: "",
      registered_business_name: "",
      registered_business_address: "",
      business_account_name: "",
      business_account_number: "",
      registrationCertificate: null,
    });
    setShowAddUserModal(true);
  }
  const closeAddUserModal = () => setShowAddUserModal(false);

  function handleAddChange(e) {
    const { name, value, type, files } = e.target;
    setAddFormData(f => ({
      ...f,
      [name]: type === "file" ? files[0] : value
    }));
  }

  async function handleAddUserSubmit(e) {
    e.preventDefault();
    if (!token) return showError("No token provided. Please log in again.");
    try {
      let payload, headers = { Authorization: `Bearer ${token}` };
      if (addFormData.role === "Dealer" && addFormData.registrationCertificate) {
        payload = new FormData();
        Object.entries(addFormData).forEach(([k, v]) => payload.append(k, v));
      } else {
        payload = JSON.stringify(addFormData);
        headers["Content-Type"] = "application/json";
      }
      const res = await fetch(baseUrl, {
        method: "POST",
        headers,
        body: payload
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess("User added!");
        (advancedUsersUI ? fetchUsersServer : fetchUsersClient)();
        closeAddUserModal();
      } else {
        showError(data.message || "Failed to add user");
      }
    } catch (err) {
      console.error(err);
              showError("Error adding user");
    }
  }

  function openEditUserModal(user) {
    setSelectedUser(user);
    setEditFormData({
      role: user.role || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      gender: user.gender || "",
      email: user.email || "",
      password: "",
      bank_name: user.bank_name || "",
      account_number: user.account_number || "",
      account_name: user.account_name || "",
      location: user.location || "",
      registered_business_name: user.business_name || "",
      registered_business_address: user.business_address || "",
      business_account_name: user.business_account_name || "",
      business_account_number: user.business_account_number || "",
      registrationCertificate: null,
    });
    setShowEditUserModal(true);
  }
  const closeEditUserModal = () => {
    setShowEditUserModal(false);
    setSelectedUser(null);
  };

  function handleEditChange(e) {
    const { name, value, type, files } = e.target;
    setEditFormData(f => ({
      ...f,
      [name]: type === "file" ? files[0] : value
    }));
  }

  async function handleEditUserSubmit(e) {
    e.preventDefault();
    if (!selectedUser?.id || !token)
      return alert("Select a user and ensure you’re logged in");
    try {
      const res = await fetch(`${baseUrl}/${selectedUser.id}`, {
        method: "PUT",   // match your router.put()
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess("User updated!");
        (advancedUsersUI ? fetchUsersServer : fetchUsersClient)();
        closeEditUserModal();
      } else {
        showError(data.message || "Failed to update");
      }
    } catch (err) {
      console.error(err);
      showError("Error updating user");
    }
  }

  async function patchUserLock(id, lock) {
    try {
      const res = await fetch(`${baseUrl}/${id}/${lock ? "lock" : "unlock"}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        (advancedUsersUI ? fetchUsersServer : fetchUsersClient)();
      } else {
        const data = await res.json().catch(() => ({}));
        console.error(data.message || "Failed");
      }
    } catch (err) {
      console.error(err);
      console.error("Error locking/unlocking user");
    }
  }

   async function handleDeleteUser(id, isPermanent = false) {
    const url = isPermanent ? `${baseUrl}/${id}?permanent=true` : `${baseUrl}/${id}`;
    
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      const deleteType = data.deleteType || (isPermanent ? 'permanent' : 'soft');
      showSuccess(`User ${deleteType} deleted successfully`);
      (advancedUsersUI ? fetchUsersServer : fetchUsersClient)();
    } else {
      const data = await res.json().catch(()=>({}));
      showError(data.message || "Failed to delete user");
    }
  }

  async function handleRestoreUser(id) {
    const res = await fetch(`${baseUrl}/${id}/restore`, {
      method: "PATCH",
      headers: {
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('Restore response:', data);
      showSuccess(data.message || "User restored successfully");
      (advancedUsersUI ? fetchUsersServer : fetchUsersClient)();
    } else {
      const data = await res.json().catch(()=>({}));
      showError(data.message || "Failed to restore user");
    }
  }

  function openDeleteConfirm(id){ 
    setDeleteUserId(id); 
    setDeleteType('soft'); // Default to soft delete
    setConfirmDeleteOpen(true); 
  }
  function closeDeleteConfirm(){ 
    setConfirmDeleteOpen(false); 
    setDeleteUserId(null); 
    setDeleteType('soft');
  }
  async function confirmDelete(){ 
    if(deleteUserId){ 
      await handleDeleteUser(deleteUserId, deleteType === 'permanent'); 
    } 
    closeDeleteConfirm(); 
  }
  function openLockConfirm(id, action){ setLockUserId(id); setLockAction(action); setConfirmLockOpen(true); }
  function closeLockConfirm(){ setConfirmLockOpen(false); setLockUserId(null); }
  async function confirmLock(){ if(lockUserId){ await patchUserLock(lockUserId, lockAction === "lock"); } closeLockConfirm(); }

  // search & paginate
  const filtered = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const name = u.role === "Dealer"
      ? u.business_name || `${u.first_name} ${u.last_name}`
      : `${u.first_name} ${u.last_name}`;
    return (
      name.toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      u.id.toString().includes(term) ||
      (u.role || "").toLowerCase().includes(term)
    );
  });
  const totalPages = Math.ceil(filtered.length / usersPerPage);
  const pageUsers = filtered.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="w-full px-2 sm:px-6 lg:px-8 py-6 space-y-4">

      {advancedUsersUI ? (
        <div className="space-y-6">
          <FiltersPanel
            serverFilters={serverFilters}
            setServerFilters={setServerFilters}
            baseUrl={baseUrl}
            NIGERIAN_STATES={NIGERIAN_STATES}
          />
          <Card className="w-full bg-card shadow-lg border-0 ring-0 outline-none">
            <CardHeader className="pb-4 flex flex-row flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-foreground">Users</CardTitle>
                <CardDescription className="text-muted-foreground">Manage users with filters, sorting and pagination</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowDeletedUsers(!showDeletedUsers)}
                  className={`h-10 sm:h-11 px-3 sm:px-4 shrink-0 text-sm ${
                    showDeletedUsers 
                      ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                      : 'btn-soft'
                  }`}
                >
                  {showDeletedUsers ? 'Hide Deleted' : 'Show Deleted'}
                </button>
                <button onClick={openAddUserModal} className="btn-primary h-10 sm:h-11 px-3 sm:px-4 shrink-0">Add User</button>
              </div>
            </CardHeader>
            <CardContent className="px-0 md:px-4">
            {/* Mobile list view */}
            <div className="md:hidden space-y-3 px-2">
              {users.length>0 ? users.map(u => (
                <div key={u.id} className="bg-card rounded-xl p-4 shadow-sm border border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <UserIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-semibold text-base truncate">{u.role === 'Dealer' ? (u.business_name || `${u.first_name} ${u.last_name}`) : `${u.first_name} ${u.last_name}`}</div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">#{u.id}</span>
                      </div>
                      <div className="text-sm text-muted-foreground break-all mb-2">{u.email}</div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">{u.role}</span>
                        {u.location && <span className="text-xs bg-muted px-2 py-1 rounded">{u.location}</span>}
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          u.deleted ? 'bg-gray-100 text-gray-800' : 
                          u.locked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {u.deleted ? 'Deleted' : u.locked ? 'Locked' : 'Active'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {u.deleted ? (
                          <button onClick={()=>handleRestoreUser(u.id)} className="btn-soft h-10 text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200">Restore</button>
                        ) : (
                          <>
                            <button onClick={()=>openEditUserModal(u)} className="btn-soft h-10 text-xs font-medium">Edit</button>
                            {u.locked ? (
                              <button onClick={()=>openLockConfirm(u.id, "unlock")} className="btn-soft h-10 text-xs font-medium">Unlock</button>
                            ) : (
                              <button onClick={()=>openLockConfirm(u.id, "lock")} className="btn-soft h-10 text-xs font-medium">Lock</button>
                            )}
                            <button onClick={()=>openDeleteConfirm(u.id)} className="btn-soft h-10 text-xs font-medium">Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-muted-foreground py-8">
                  <UserIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-lg font-medium">No users found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
            {/* Desktop/tablet table */}
            <div className="hidden md:block overflow-x-auto bg-card rounded shadow mt-2">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    {['ID','Name','Role','Location','Status','Actions'].map(h=> (
                      <th key={h} className="px-3 md:px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.length>0 ? users.map(u => (
                    <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-3 md:px-4 py-4 text-sm font-medium text-muted-foreground">#{u.id}</td>
                      <td className="px-3 md:px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mr-3 shrink-0">
                            <UserIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{u.role === 'Dealer' ? (u.business_name || `${u.first_name} ${u.last_name}`) : `${u.first_name} ${u.last_name}`}</div>
                            <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-4">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">{u.role}</span>
                      </td>
                      <td className="px-3 md:px-4 py-4 text-sm text-muted-foreground">{u.location || '-'}</td>
                      <td className="px-3 md:px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          u.deleted ? 'bg-gray-100 text-gray-800' : 
                          u.locked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {u.deleted ? 'Deleted' : u.locked ? 'Locked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-4">
                        <div className="flex items-center gap-1">
                          {u.deleted ? (
                            <button onClick={() => handleRestoreUser(u.id)} className="btn-soft text-xs px-2 py-1 h-8 bg-green-100 text-green-800 hover:bg-green-200">Restore</button>
                          ) : (
                            <>
                              <button onClick={() => openEditUserModal(u)} className="btn-soft text-xs px-2 py-1 h-8">Edit</button>
                              {u.locked ? (
                                <button onClick={() => openLockConfirm(u.id, "unlock")} className="btn-soft text-xs px-2 py-1 h-8">Unlock</button>
                              ) : (
                                <button onClick={() => openLockConfirm(u.id, "lock")} className="btn-soft text-xs px-2 py-1 h-8">Lock</button>
                              )}
                              <button onClick={() => openDeleteConfirm(u.id)} className="btn-soft text-xs px-2 py-1 h-8">Delete</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        <UserIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 px-2 md:px-0">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                <span className="font-medium">{serverPagination.total}</span> total users • Page <span className="font-medium">{serverPagination.page}</span> of <span className="font-medium">{serverPagination.pages}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button 
                  disabled={serverFilters.page<=1} 
                  onClick={()=>setServerFilters(s=>({...s, page: Math.max(1, s.page-1)}))} 
                  className="btn-soft h-9 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button 
                  disabled={serverFilters.page>=serverPagination.pages} 
                  onClick={()=>setServerFilters(s=>({...s, page: Math.min(serverPagination.pages, s.page+1)}))} 
                  className="btn-soft h-9 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <select 
                  value={serverFilters.limit} 
                  onChange={e=>setServerFilters(s=>({...s, limit: parseInt(e.target.value,10)||10, page:1}))} 
                  className="select-soft h-9 text-sm"
                >
                  {[10,20,50,100].map(n=> <option key={n} value={n}>{n} per page</option>)}
                </select>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Search by name, email, ID or role"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-soft w-full mb-3 font-bold"
          />
          {error && <p className="text-red-600">{error}</p>}
          <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["ID","Name","Role","Location","Status","Actions"].map(h => (
                <th
                  key={h}
                  className="px-6 py-3 text-xs font-bold text-gray-500 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pageUsers.length > 0 ? pageUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{u.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <UserIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <div className="font-bold">
                        {u.role === "Dealer"
                          ? u.business_name || `${u.first_name} ${u.last_name}`
                          : `${u.first_name} ${u.last_name}`}
                      </div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{u.role}</td>
                <td className="px-6 py-4 text-sm">{u.location}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    u.locked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                  }`}>
                    {u.locked ? "Locked" : "Active"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => openEditUserModal(u)}
                    className="bg-black text-[#FFD700] px-3 py-1 rounded font-bold"
                  >
                    Edit
                  </button>
                  {u.locked ? (
                    <button
                      onClick={() => patchUserLock(u.id, false)}
                      className="bg-black text-[#FFD700] px-3 py-1 rounded font-bold"
                    >
                      Unlock
                    </button>
                  ) : (
                    <button
                      onClick={() => patchUserLock(u.id, true)}
                      className="bg-black text-[#FFD700] px-3 py-1 rounded font-bold"
                    >
                      Lock
                    </button>
                  )}
                  <button
                    onClick={() => openDeleteConfirm(u.id)}
                    className="bg-black text-[#FFD700] px-3 py-1 rounded font-bold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2 mt-3">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`btn-soft ${currentPage === page ? 'bg-black text-[#FFD700] hover:bg-black' : ''}`}
          >
            {page}
          </button>
        ))}
      </div>
        </div>
      )}

      </div>

      {/* ADD USER SHEET */}
      {showAddUserModal && (
        <Sheet open={showAddUserModal} onOpenChange={(v)=>{ if(!v) closeAddUserModal(); }}>
          <SheetContent side="right" className="flex flex-col h-full">
            <div className="sticky top-0 z-10 border-b bg-background px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add New User</h2>
              <button onClick={closeAddUserModal} className="btn-soft px-3 py-1">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="addUserForm" onSubmit={handleAddUserSubmit} className="space-y-4">
              {/* Role */}
              <div>
                <label className="font-bold">Role</label>
                <select
                  name="role"
                  value={addFormData.role}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="SuperAdmin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Marketer">Marketer</option>
                  <option value="Dealer">Dealer</option>
                </select>
              </div>

              {/* First & Last Name */}
              <div>
                <label className="font-bold">First Name</label>
                <input
                  name="first_name"
                  value={addFormData.first_name}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="font-bold">Last Name</label>
                <input
                  name="last_name"
                  value={addFormData.last_name}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <label className="font-bold">Gender</label>
                <select
                  name="gender"
                  value={addFormData.gender}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Email & Password */}
              <div>
                <label className="font-bold">Email</label>
                <input
                  name="email"
                  type="email"
                  value={addFormData.email}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
              <div className="relative">
                <label className="font-bold">Password</label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={addFormData.password}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="min 12 chars, include number & special"
                  required
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute inset-y-0 right-0 pr-3 text-sm text-gray-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Bank fields for non-Dealers */}
              {addFormData.role !== "Dealer" && (
                <>
                  <div>
                    <label className="font-bold">Bank Name</label>
                    <input
                      name="bank_name"
                      value={addFormData.bank_name}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold">Account Number</label>
                    <input
                      name="account_number"
                      value={addFormData.account_number}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold">Account Name</label>
                    <input
                      name="account_name"
                      value={addFormData.account_name}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                </>
              )}

              {/* Location */}
              <div>
                <label className="font-bold">Location</label>
                <select
                  name="location"
                  value={addFormData.location}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Dealer-specific */}
              {addFormData.role === "Dealer" && (
                <>
                  <div>
                    <label className="font-bold">Registered Business Name</label>
                    <input
                      name="registered_business_name"
                      value={addFormData.registered_business_name}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold">Registered Business Address</label>
                    <input
                      name="registered_business_address"
                      value={addFormData.registered_business_address}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold">Business Account Name</label>
                    <input
                      name="business_account_name"
                      value={addFormData.business_account_name}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold">Business Account Number</label>
                    <input
                      name="business_account_number"
                      value={addFormData.business_account_number}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold">Registration Certificate (PDF)</label>
                    <input
                      name="registrationCertificate"
                      type="file"
                      accept="application/pdf"
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                </>
              )}

            </form>
            </div>
            <div className="sticky bottom-0 z-10 border-t bg-background px-6 py-3 flex justify-end gap-3">
              <button type="button" onClick={closeAddUserModal} className="btn-soft">Cancel</button>
              <button type="submit" form="addUserForm" className="btn-primary">Save</button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* EDIT USER SHEET */}
      {showEditUserModal && selectedUser && (
        <Sheet open={showEditUserModal} onOpenChange={(v)=>{ if(!v) closeEditUserModal(); }}>
          <SheetContent side="right" className="flex flex-col h-full">
            <div className="sticky top-0 z-10 border-b bg-background px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit User</h2>
              <button onClick={closeEditUserModal} className="btn-soft px-3 py-1">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form id="editUserForm" onSubmit={handleEditUserSubmit} className="space-y-4">
              {/* Role */}
              <div>
                <label className="font-bold">Role</label>
                <select
                  name="role"
                  value={editFormData.role}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="SuperAdmin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Marketer">Marketer</option>
                  <option value="Dealer">Dealer</option>
                </select>
              </div>

              {/* First & Last Name */}
              <div>
                <label className="font-bold">First Name</label>
                <input
                  name="first_name"
                  value={editFormData.first_name}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="font-bold">Last Name</label>
                <input
                  name="last_name"
                  value={editFormData.last_name}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="font-bold">Gender</label>
                <select
                  name="gender"
                  value={editFormData.gender}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="font-bold">Email</label>
                <input
                  name="email"
                  type="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <label className="font-bold">Password</label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={editFormData.password}
                  onChange={handleEditChange}
                  placeholder="Leave blank to keep current"
                  className="w-full border px-3 py-2 rounded"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute inset-y-0 right-0 pr-3 text-sm text-gray-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Bank fields for non-Dealers */}
              {editFormData.role !== "Dealer" && (
                <>
                  <div>
                    <label className="font-bold">Bank Name</label>
                    <input
                      name="bank_name"
                      value={editFormData.bank_name}
                      onChange={handleEditChange}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Account Number</label>
                    <input
                      name="account_number"
                      value={editFormData.account_number}
                      onChange={handleEditChange}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Account Name</label>
                    <input
                      name="account_name"
                      value={editFormData.account_name}
                      onChange={handleEditChange}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                </>
              )}

              {/* Location */}
              <div>
                <label className="font-bold">Location</label>
                <select
                  name="location"
                  value={editFormData.location}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Submit moved to sticky footer */}
              </form>
            </div>
            <div className="sticky bottom-0 z-10 border-t bg-background px-6 py-3 flex justify-end gap-3">
              <button type="button" onClick={closeEditUserModal} className="btn-soft">Cancel</button>
              <button type="submit" form="editUserForm" className="btn-primary">Update</button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeDeleteConfirm} aria-hidden="true" />
          <div role="dialog" aria-modal="true" className="relative w-full max-w-[480px] bg-background rounded-xl shadow-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-2">Delete User</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose how you want to delete this user:
            </p>
            
            {/* Delete Type Selection */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" 
                   onClick={() => setDeleteType('soft')}>
                <input 
                  type="radio" 
                  name="deleteType" 
                  value="soft" 
                  checked={deleteType === 'soft'}
                  onChange={() => setDeleteType('soft')}
                  className="text-[#f59e0b]"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">Soft Delete (Recommended)</div>
                  <div className="text-xs text-muted-foreground">
                    User will be hidden but can be restored later. Related data is preserved.
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" 
                   onClick={() => setDeleteType('permanent')}>
                <input 
                  type="radio" 
                  name="deleteType" 
                  value="permanent" 
                  checked={deleteType === 'permanent'}
                  onChange={() => setDeleteType('permanent')}
                  className="text-red-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-red-600">Permanent Delete</div>
                  <div className="text-xs text-muted-foreground">
                    User and all related data will be permanently removed. This cannot be undone.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button onClick={closeDeleteConfirm} className="btn-soft px-4 py-2">Cancel</button>
              <button 
                onClick={confirmDelete} 
                className={`px-4 py-2 rounded font-medium ${
                  deleteType === 'permanent' 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-[#f59e0b] text-black hover:bg-[#f59e0b]/90'
                }`}
              >
                {deleteType === 'permanent' ? 'Permanently Delete' : 'Soft Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM LOCK/UNLOCK */}
      <ConfirmDialog
        open={confirmLockOpen}
        title={lockAction === "lock" ? "Lock this user?" : "Unlock this user?"}
        description={lockAction === "lock" ? "The user will be prevented from logging in until unlocked." : "The user will be able to login again."}
        confirmText={lockAction === "lock" ? "Lock" : "Unlock"}
        cancelText="Cancel"
        onConfirm={confirmLock}
        onCancel={closeLockConfirm}
      />
    </div>
  );
}
