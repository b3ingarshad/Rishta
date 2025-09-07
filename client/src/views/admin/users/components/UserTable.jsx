import React, { useState,useRef, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function calculateAge(dobString) {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
 const [actionMenuOpenFor, setActionMenuOpenFor] = useState(null);
  const [viewUser, setViewUser] = useState(null);

  // Close action dropdown if clicked outside
  const actionMenuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setActionMenuOpenFor(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Your existing fetchUsers, openModal, closeModal methods...

  const openActionMenu = (userId) => {
    if (actionMenuOpenFor === userId) {
      setActionMenuOpenFor(null);
    } else {
      setActionMenuOpenFor(userId);
    }
  };

  const handleViewUser = (user) => {
    setViewUser(user);
    setActionMenuOpenFor(null);
  };

  const closeViewUser = () => {
    setViewUser(null);
  };

  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "Male",
    connectedMember: "",
    country: "India",
    pin: "",
    state: "",
    city: "",
    mobile: "",
    email: "",
    address: "",
    referral: "",
    agree: false,
  });

  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}api/users`);
      setUsers(res.data);
    } catch {
      toast.error("Failed to fetch users");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePincodeChange = async (e) => {
    const pin = e.target.value;
    setNewUser((prev) => ({ ...prev, pin }));
    if (pin.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await response.json();
        if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length) {
          const info = data[0].PostOffice[0];
          setNewUser((prev) => ({
            ...prev,
            state: info.State || "",
            city: info.District || "",
            pin,
          }));
          toast.success("State and city autofilled from pincode!");
        } else {
          toast.error("Invalid pincode or not found.");
        }
      } catch {
        toast.error("Unable to fetch state and city.");
      }
    }
  };

  const handleSaveUser = async () => {
    console.log(newUser,"newUser");
    const requiredFields = [
      "firstName", "lastName", "dob", "gender", "country",
      "pin", "state", "city", "mobile", "email", "address",
    ];
    const missingField = requiredFields.find((field) => !newUser[field]);
    if (missingField || !newUser.agree) {
      toast.error("Please fill all required fields and accept Terms & Conditions.");
      return;
    }
    if (calculateAge(newUser.dob) < 18) {
      toast.error("User age must be at least 18.");
      return;
    }


    try {
      if (editingUserId) {
        await axios.put(`${API_BASE}api/users/${editingUserId}`, newUser);
        toast.success("User updated successfully!");
      } else {
        await axios.post(`${API_BASE}api/users`, newUser);
        toast.success("User added successfully!");
      }
      fetchUsers();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error while saving user");
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
    if (user) {
      setNewUser({ ...user, agree: false });
      setEditingUserId(user._id);
    } else {
      setNewUser({
        firstName: "", lastName: "", dob: "", gender: "Male",
        connectedMember: "", country: "India", pin: "", state: "", city: "",
        mobile: "", email: "", address: "", referral: "", agree: false,
      });
      setEditingUserId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUserId(null);
  };

  return (
    <div className="p-6">
      <ToastContainer />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">User Table</h2>
        <button onClick={() => openModal()} className="bg-[#C4010A] text-white px-4 py-2 rounded hover:bg-indigo-700">+ Add User</button>
      </div>

      <input type="text" placeholder="Search by name or email..." className="mb-4 px-4 py-2 border rounded w-full md:w-1/3" value={search} onChange={(e) => setSearch(e.target.value)} />

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
            {currentUsers.length ? currentUsers.map(user => (
              <tr key={user._id}>
                <td className="px-4 py-2 border-b">{user.firstName} {user.lastName}</td>
                <td className="px-4 py-2 border-b">{user.email}</td>
                <td className="px-4 py-2 border-b">{user.mobile}</td>
                <td className="px-4 py-2 border-b">{user.city}</td>
                <td className="px-4 py-2 border-b">{user.referral || "-"}</td>
                <td className="px-4 py-2 border-b">
               <button
                    onClick={() => openActionMenu(user._id)}
                    className="px-2 py-1 text-lg font-bold hover:bg-gray-200 rounded"
                    aria-label="More actions"
                  >
                    ⋮
                  </button>
                  {actionMenuOpenFor === user._id && (
                    <div
                      ref={actionMenuRef}
                      className="absolute right-3 mt-8 bg-white border rounded shadow-md z-50"
                    >
                      <button
                        className="block px-4 py-2 hover:bg-blue-100 w-full text-left"
                        onClick={() => handleViewUser(user)}
                      >
                        View
                      </button>
                      <button
                        className="block px-4 py-2 hover:bg-blue-100 w-full text-left"
                        onClick={() => {
                          openModal(user);
                          setActionMenuOpenFor(null);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="block px-4 py-2 hover:bg-blue-100 w-full text-left text-red-600"
                        onClick={() => {
                          handleDeleteUser(user._id);
                          setActionMenuOpenFor(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>

              </tr>
            )) : (
              <tr><td colSpan="6" className="text-center py-4 text-gray-500">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center items-center mt-4 space-x-2">
        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
        <span className="px-2">Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>

      {isModalOpen && (
        <div className="z-40 fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">{editingUserId ? "Edit User" : "Add New User"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="First Name *" value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} className="px-3 py-2 border rounded" />
              <input type="text" placeholder="Last Name *" value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} className="px-3 py-2 border rounded" />
              <input type="date" placeholder="DOB *" value={newUser.dob} onChange={e => setNewUser({ ...newUser, dob: e.target.value })} className="px-3 py-2 border rounded" />
              <select value={newUser.gender} onChange={e => setNewUser({ ...newUser, gender: e.target.value })} className="px-3 py-2 border rounded">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
              <input type="text" placeholder="Connected Member's Profile" value={newUser.connectedMember} onChange={e => setNewUser({ ...newUser, connectedMember: e.target.value })} className="px-3 py-2 border rounded col-span-2" />

              <input type="text" readOnly placeholder="Country *" value="India" onChange={e => setNewUser({ ...newUser, country: e.target.value })} className="px-3 py-2 border rounded" />
              <input type="text" placeholder="Pin Code *" value={newUser.pin} onChange={handlePincodeChange} className="px-3 py-2 border rounded" maxLength={6} />
              <input type="text" placeholder="State *" value={newUser.state} onChange={e => setNewUser({ ...newUser, state: e.target.value })} className="px-3 py-2 border rounded" />
              <input type="text" placeholder="City *" value={newUser.city} onChange={e => setNewUser({ ...newUser, city: e.target.value })} className="px-3 py-2 border rounded" />
              
              <input type="text" placeholder="Mobile *" value={newUser.mobile} onChange={e => setNewUser({ ...newUser, mobile: e.target.value })} className="px-3 py-2 border rounded" />
              <input type="email" placeholder="Email *" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="px-3 py-2 border rounded" />
              <textarea placeholder="Address *" value={newUser.address} onChange={e => setNewUser({ ...newUser, address: e.target.value })} className="px-3 py-2 border rounded col-span-2" />
              <input type="text" placeholder="Referral Code" value={newUser.referral} onChange={e => setNewUser({ ...newUser, referral: e.target.value })} className="px-3 py-2 border rounded col-span-2" />
            </div>

            <div className="flex items-center mt-3">
              <input type="checkbox" checked={newUser.agree} onChange={e => setNewUser({ ...newUser, agree: e.target.checked })} className="mr-2" />
              <span className="text-sm">I have read &amp; agree to the <a href="#" className="text-blue-600 underline">Terms and Conditions</a> *</span>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={handleSaveUser} className="px-4 py-2 bg-[#C4010A] text-white rounded hover:bg-indigo-700">{editingUserId ? "Update User" : "Add User"}</button>
            </div>
          </div>
        </div>
      )}

      {viewUser && (
        <div className="z-50 fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-bold mb-4">User Details</h3>
            <div className="space-y-2">
              <p><strong>First Name:</strong> {viewUser.firstName}</p>
              <p><strong>Last Name:</strong> {viewUser.lastName}</p>
              <p><strong>DOB:</strong> {viewUser.dob?.slice(0,10)}</p>
              <p><strong>Gender:</strong> {viewUser.gender}</p>
              <p><strong>Connected Member:</strong> {viewUser.connectedMember || "-"}</p>
              <p><strong>Country:</strong> {viewUser.country}</p>
              <p><strong>State:</strong> {viewUser.state}</p>
              <p><strong>City:</strong> {viewUser.city}</p>
              <p><strong>Pin Code:</strong> {viewUser.pin}</p>
              <p><strong>Mobile:</strong> {viewUser.mobile}</p>
              <p><strong>Email:</strong> {viewUser.email}</p>
              <p><strong>Address:</strong> {viewUser.address}</p>
              <p><strong>Referral:</strong> {viewUser.referral || "-"}</p>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={closeViewUser}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
