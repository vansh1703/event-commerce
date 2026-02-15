"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";
import LogoutButton from "@/components/navbar/LogoutButton";

type User = {
  id: string;
  email: string;
  full_name?: string;
  name?: string;
  phone: string;
  age?: number;
  city?: string;
  user_type: string;
  profile_photo?: string;
  id_proof_photo?: string;
};

const USERS_PER_PAGE = 12;

export default function EditUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Edit form fields
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);
    if (parsedUser.user_type !== "superadmin") {
      alert("Unauthorized! SuperAdmin access only.");
      router.push("/auth/login");
      return;
    }

    loadUsers();
  }, [router]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, cityFilter, users]);

  const loadUsers = async () => {
    try {
      const data = await apiCall("/users/seekers", { method: "GET" });
      if (data.success) {
        console.log('Loaded users:', data.users);
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          (user.full_name?.toLowerCase() || user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (user.phone || '').includes(searchTerm) ||
          (user.city?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    // City filter
    if (cityFilter !== "all") {
      filtered = filtered.filter((user) => user.city === cityFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const getCities = () => {
    const cities = new Set(
      users
        .map((user) => user.city)
        .filter((city): city is string => !!city)
    );
    return Array.from(cities).sort();
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditEmail(user.email || '');
    setEditPassword("");
    setEditFullName(user.full_name || user.name || '');
    setEditPhone(user.phone || '');
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    if (!editEmail || !editFullName || !editPhone) {
      alert("Please fill all required fields!");
      return;
    }

    setProcessing(true);

    try {
      const updateData: any = {
        email: editEmail,
        full_name: editFullName,
        phone: editPhone,
      };

      if (editPassword) {
        updateData.password = editPassword;
      }

      const data = await apiCall(`/users/${selectedUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });

      if (data.success) {
        alert("✅ User updated successfully!");
        setShowEditModal(false);
        await loadUsers();
      }
    } catch (error: any) {
      alert(error.message || "Failed to update user");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    const confirmed = confirm(
      `⚠️ Are you sure you want to delete "${userName}"?\n\nThis will also delete all their applications and data. This action cannot be undone!`
    );

    if (!confirmed) return;

    setProcessing(true);

    try {
      const data = await apiCall(`/users/${userId}`, {
        method: "DELETE",
      });

      if (data.success) {
        alert("✅ User deleted successfully!");
        await loadUsers();
      }
    } catch (error: any) {
      alert(error.message || "Failed to delete user");
    } finally {
      setProcessing(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getUserDisplayName = (user: User) => {
    return user.full_name || user.name || "Unknown User";
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <button
              onClick={() => router.push("/superadmin/dashboard")}
              className="text-indigo-600 hover:text-purple-600 font-semibold mb-2 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <h1>👤</h1>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
               Manage Job Seekers
            </h1>
            <p className="text-gray-600 mt-2">Total: {users.length} job seekers</p>
          </div>

          <LogoutButton />
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🔍 Search & Filter Users</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Name, Email, Phone, or City
              </label>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                name="user-search-field"
                className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
              />
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by City
              </label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
              >
                <option value="all">All Cities</option>
                {getCities().map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <p className="text-gray-500">
              {searchTerm || cityFilter !== "all"
                ? "No users match your filters."
                : "No users found."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {user.profile_photo ? (
                      <img
                        src={user.profile_photo}
                        alt={getUserDisplayName(user)}
                        className="w-16 h-16 rounded-full object-cover border-2 border-orange-300"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-xl">
                        {getInitials(getUserDisplayName(user))}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-sm">{getUserDisplayName(user)}</h3>
                      <p className="text-xs text-gray-600">{user.city || 'No city'}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600 mb-4">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Phone:</strong> {user.phone}</p>
                    {user.age && <p><strong>Age:</strong> {user.age} years</p>}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all font-semibold text-xs"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, getUserDisplayName(user))}
                      className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-2 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all font-semibold text-xs"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white rounded-xl border-2 border-orange-200 text-orange-600 font-semibold hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                        currentPage === page
                          ? "bg-orange-600 text-white"
                          : "bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white rounded-xl border-2 border-orange-200 text-orange-600 font-semibold hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              ✏️ Edit User: {getUserDisplayName(selectedUser)}
            </h2>

            {/* Photos Section */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Profile Photo */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">📸 Profile Photo</h3>
                {selectedUser.profile_photo ? (
                  <img
                    src={selectedUser.profile_photo}
                    alt="Profile"
                    onClick={() => {
                      setSelectedPhoto(selectedUser.profile_photo!);
                      setShowPhotoModal(true);
                    }}
                    className="w-full h-40 object-cover rounded-2xl border-2 border-orange-300 cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 rounded-2xl border-2 border-gray-300 flex items-center justify-center">
                    <p className="text-gray-500 text-sm">No profile photo</p>
                  </div>
                )}
              </div>

              {/* ID Proof Photo */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">🆔 ID Proof</h3>
                {selectedUser.id_proof_photo ? (
                  <img
                    src={selectedUser.id_proof_photo}
                    alt="ID Proof"
                    onClick={() => {
                      setSelectedPhoto(selectedUser.id_proof_photo!);
                      setShowPhotoModal(true);
                    }}
                    className="w-full h-40 object-cover rounded-2xl border-2 border-orange-300 cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 rounded-2xl border-2 border-gray-300 flex items-center justify-center">
                    <p className="text-gray-500 text-sm">No ID proof</p>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-green-600 mb-6 text-center">
              🔍 Click on photos to view in full size
            </p>

            {/* Edit Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  autoComplete="off"
                  name="edit-user-email"
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                  disabled={processing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password or leave blank"
                  autoComplete="new-password"
                  name="edit-user-password"
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                  disabled={processing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  autoComplete="off"
                  name="edit-user-name"
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                  disabled={processing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  autoComplete="off"
                  name="edit-user-phone"
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                  disabled={processing}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl hover:bg-gray-300 transition-all font-semibold"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-2xl hover:from-orange-600 hover:to-red-700 transition-all font-semibold shadow-lg disabled:opacity-50"
                disabled={processing}
              >
                {processing ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Enlarge Modal */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div className="relative max-w-6xl max-h-[90vh]">
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute -top-12 right-0 text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold"
            >
              ✕ Close
            </button>
            <img
              src={selectedPhoto}
              alt="Enlarged"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </main>
  );
}