"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";
import LogoutButton from "@/components/navbar/LogoutButton";

type Company = {
  id: string;
  email: string;
  company_name: string;
  company_address: string;
  contact_person: string;
  phone: string;
  user_type: string;
};

const COMPANIES_PER_PAGE = 10;

export default function EditCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Edit form fields
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCompanyAddress, setEditCompanyAddress] = useState("");
  const [editContactPerson, setEditContactPerson] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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

    // Check password protection
    const editCompaniesAuth = sessionStorage.getItem("editCompaniesAuth");
    if (editCompaniesAuth !== "authorized") {
      const password = prompt(
        "🔒 Enter SuperAdmin password to access Company Management:",
      );
      if (password === "123456") {
        sessionStorage.setItem("editCompaniesAuth", "authorized");
        setIsAuthorized(true);
        setCheckingAuth(false);
        loadCompanies();
      } else {
        alert("❌ Incorrect password! Redirecting to dashboard...");
        router.push("/superadmin/dashboard");
      }
    } else {
      setIsAuthorized(true);
      setCheckingAuth(false);
      loadCompanies();
    }
  }, [router]);

  useEffect(() => {
    filterCompanies();
  }, [searchTerm, companies]);

  const loadCompanies = async () => {
    try {
      const data = await apiCall("/users/companies", { method: "GET" });
      if (data.success) {
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = [...companies];

    if (searchTerm) {
      filtered = filtered.filter(
        (company) =>
          (company.company_name?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          ) ||
          (company.email?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          ) ||
          (company.contact_person?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          ) ||
          (company.phone || "").includes(searchTerm) ||
          (company.company_address?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          ),
      );
    }

    setFilteredCompanies(filtered);
    setCurrentPage(1);
  };

  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setEditEmail(company.email);
    setEditPassword("");
    setEditCompanyName(company.company_name);
    setEditCompanyAddress(company.company_address);
    setEditContactPerson(company.contact_person);
    setEditPhone(company.phone);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedCompany) return;

    if (!editEmail || !editCompanyName || !editContactPerson || !editPhone) {
      alert("Please fill all required fields!");
      return;
    }

    setProcessing(true);

    try {
      const updateData: any = {
        email: editEmail,
        company_name: editCompanyName,
        company_address: editCompanyAddress,
        contact_person: editContactPerson,
        phone: editPhone,
      };

      if (editPassword) {
        updateData.password = editPassword;
      }

      const data = await apiCall(`/users/${selectedCompany.id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });

      if (data.success) {
        alert("✅ Company updated successfully!");
        setShowEditModal(false);
        await loadCompanies();
      }
    } catch (error: any) {
      alert(error.message || "Failed to update company");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (companyId: string, companyName: string) => {
    const confirmed = confirm(
      `⚠️ Are you sure you want to delete "${companyName}"?\n\nThis will also delete all their job requests and data. This action cannot be undone!`,
    );

    if (!confirmed) return;

    setProcessing(true);

    try {
      const data = await apiCall(`/users/${companyId}`, {
        method: "DELETE",
      });

      if (data.success) {
        alert("✅ Company deleted successfully!");
        await loadCompanies();
      }
    } catch (error: any) {
      alert(error.message || "Failed to delete company");
    } finally {
      setProcessing(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredCompanies.length / COMPANIES_PER_PAGE);
  const startIndex = (currentPage - 1) * COMPANIES_PER_PAGE;
  const endIndex = startIndex + COMPANIES_PER_PAGE;
  const currentCompanies = filteredCompanies.slice(startIndex, endIndex);

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading companies...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {checkingAuth
              ? "Checking authorization..."
              : "Loading companies..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
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
            <h1>🏢</h1>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Manage Companies
            </h1>
            <p className="text-gray-600 mt-2">
              Total: {companies.length} companies
            </p>
          </div>

          <LogoutButton />
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            🔍 Search Companies
          </h3>
          <input
            type="text"
            placeholder="Search by company name, email, contact person, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            name="company-search-field"
            className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
          />

          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Showing {filteredCompanies.length} of {companies.length} companies
            </p>

            {/* Clear Filter Button */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-semibold text-sm shadow-lg"
              >
                ✕ Clear Search
              </button>
            )}
          </div>
        </div>

        {/* Companies List */}
        {filteredCompanies.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <p className="text-gray-500">
              {searchTerm
                ? "No companies match your search."
                : "No companies found."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentCompanies.map((company) => (
                <div
                  key={company.id}
                  className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200 hover:shadow-xl transition-all"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    {company.company_name}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>
                      <strong>Email:</strong> {company.email}
                    </p>
                    <p>
                      <strong>Contact Person:</strong> {company.contact_person}
                    </p>
                    <p>
                      <strong>Phone:</strong> {company.phone}
                    </p>
                    <p>
                      <strong>Address:</strong>{" "}
                      {company.company_address || "N/A"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(company)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-2 rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all font-semibold text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(company.id, company.company_name)
                      }
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-2 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-semibold text-sm"
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white rounded-xl border-2 border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white rounded-xl border-2 border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              ✏️ Edit Company: {selectedCompany.company_name}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
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
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                  disabled={processing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                  disabled={processing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Address
                </label>
                <input
                  type="text"
                  value={editCompanyAddress}
                  onChange={(e) => setEditCompanyAddress(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                  disabled={processing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={editContactPerson}
                  onChange={(e) => setEditContactPerson(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
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
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
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
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-2xl hover:from-blue-600 hover:to-cyan-700 transition-all font-semibold shadow-lg disabled:opacity-50"
                disabled={processing}
              >
                {processing ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
