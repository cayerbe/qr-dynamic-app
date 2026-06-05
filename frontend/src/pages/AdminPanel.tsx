import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Navbar from "@components/Navbar";

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth(); // Get current logged-in user

  const db = getFirestore();
  const functions = getFunctions();

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
      setLoading(false);
    };

    fetchUsers();
  }, [db]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!currentUser || currentUser.role !== "admin") {
      alert("Only admins can change roles.");
      return;
    }

    const setUserRole = httpsCallable(functions, "setUserRole");
    try {
      await setUserRole({ userId, role: newRole });
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user,
        ),
      );
      alert(`Updated role to ${newRole}`);
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role.");
    }
  };

  if (!currentUser || currentUser.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col pt-[60px]">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">
          Admin Panel - User Management
        </h1>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">
                  Display Name
                </th>
                <th className="border border-gray-300 px-4 py-2">Role</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.email}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.displayName || "N/A"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      className="border border-gray-300 p-1"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="manufacturer">Manufacturer</option>
                      <option value="inspector">Inspector</option>
                    </select>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <button
                      onClick={() => handleRoleChange(user.id, user.role)}
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
