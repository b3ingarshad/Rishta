import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserForm from "./UserForm";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const actionMenuRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
    const handleClickOutside = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setEditingUserId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}api/users`);
      setUsers(res.data);
    } catch {
      toast.error("Failed to fetch users");
    }
  };

  const handleSaveUser = async (formData) => {
    try {
      setLoading(true); // Start loader
      if (editingUserId) {
        await axios.put(`${API_BASE}api/auth/admin/edit-user/${editingUserId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("User updated successfully!");
      } else {
        await axios.post(`${API_BASE}api/auth/admin/add-user`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("User added successfully!");
      }
      fetchUsers();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error while saving user");
    } finally {
      setLoading(false); // Stop loader
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${API_BASE}api/users/${id}`);
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch {
      toast.error("Error deleting user");
    }
  };

  const openModal = (user = null) => {
    setEditingUserId(user ? user._id : null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUserId(null);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const currentUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const calculateAge = (dobString) => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  return (
    <div className="p-6">
      <ToastContainer />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">User Table</h2>
        <button onClick={() => openModal()} className="bg-[#C4010A] text-white px-4 py-2 rounded hover:bg-indigo-700">
          + Add User
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name or email..."
        className="mb-4 px-4 py-2 border rounded w-full md:w-1/3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Email</th>
              <th className="px-4 py-2 border-b">Mobile</th>
              <th className="px-4 py-2 border-b">City</th>
              <th className="px-4 py-2 border-b">Referral</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {currentUsers.length ? (
              currentUsers.map((user) => (
                <tr key={user._id}>
                  <td className="px-4 py-2 border-b">{user.fullName}</td>
                  <td className="px-4 py-2 border-b">{user.email}</td>
                  <td className="px-4 py-2 border-b">{user.mobile}</td>
                  <td className="px-4 py-2 border-b">{user.city}</td>
                  <td className="px-4 py-2 border-b">{user.referralId || "-"}</td>
                  <td className="px-4 py-2 border-b">
                    <button onClick={() => setViewUser(user)} className="px-2 py-1 text-sm text-blue-600">
                      View
                    </button>
                    <button onClick={() => openModal(user)} className="px-2 py-1 text-sm text-green-600">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteUser(user._id)} className="px-2 py-1 text-sm text-red-600">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center items-center mt-4 space-x-2">
        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">
          Prev
        </button>
        <span className="px-2">Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
          Next
        </button>
      </div>

     {isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl relative">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-bold">{editingUserId ? "Edit User" : "Add New User"}</h3>
        <button onClick={closeModal} className="text-gray-500 hover:text-red-600">&times;</button>
      </div>
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <UserForm 
          initialData={editingUserId ? users.find((u) => u._id === editingUserId) : {}} 
          onSubmit={handleSaveUser} 
          isAdmin={true} 
          loading={loading}
        />
      </div>
    </div>
  </div>
)}


      {viewUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">User Details</h3>
            <div className="space-y-2">
              <p><strong>Full Name:</strong> {viewUser.fullName}</p>
              <p><strong>Email:</strong> {viewUser.email}</p>
              <p><strong>Mobile:</strong> {viewUser.mobile}</p>
              <p><strong>City:</strong> {viewUser.city}</p>
              <p><strong>State:</strong> {viewUser.state}</p>
              <p><strong>Address:</strong> {viewUser.address}</p>
              <p><strong>Referral Code:</strong> {viewUser.referralId || "-"}</p>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setViewUser(null)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
