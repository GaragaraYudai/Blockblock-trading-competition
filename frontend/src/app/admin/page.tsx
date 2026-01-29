"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isAdmin, fetchWithAuth, getCurrentUser, logout } from "@/lib/auth";
import { User } from "@/lib/auth";
import { Check, X, Edit, Loader2, ArrowLeft, LogOut } from "lucide-react";
import Image from "next/image";

const API_URL = "https://blockblock-trading-competition-production.up.railway.app";

export default function AdminPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({
        username: "",
        wallet_address: "",
    });

    // Check authentication and admin status
    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/auth");
            return;
        }

        if (!isAdmin()) {
            router.push("/dashboard");
            return;
        }

        fetchUsers();
    }, [router, filter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const filterParam = filter === "all" ? "" : `?status_filter=${filter}`;
            const response = await fetchWithAuth(`${API_URL}/api/admin/users${filterParam}`);
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: number) => {
        try {
            await fetchWithAuth(`${API_URL}/api/admin/approve/${userId}`, {
                method: "POST",
            });
            fetchUsers();
        } catch (error) {
            console.error("Failed to approve user:", error);
            alert("사용자 승인에 실패했습니다");
        }
    };

    const handleReject = async (userId: number) => {
        if (!confirm("정말 이 사용자를 거절/삭제하시겠습니까?")) return;

        try {
            await fetchWithAuth(`${API_URL}/api/admin/reject/${userId}`, {
                method: "DELETE",
            });
            fetchUsers();
        } catch (error) {
            console.error("Failed to reject user:", error);
            alert("사용자 거절에 실패했습니다");
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setEditForm({
            username: user.username,
            wallet_address: user.wallet_address,
        });
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;

        try {
            const formData = new FormData();
            formData.append("username", editForm.username);
            formData.append("wallet_address", editForm.wallet_address);

            await fetchWithAuth(`${API_URL}/api/admin/update/${editingUser.id}`, {
                method: "PUT",
                body: formData,
            });

            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error("Failed to update user:", error);
            alert("사용자 정보 수정에 실패했습니다");
        }
    };

    return (
        <main className="min-h-screen bg-[#0E1015] text-gray-200 font-sans">
            {/* Background effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-900/10 rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <nav className="border-b border-white/5 bg-[#151921]/80 backdrop-blur-xl sticky top-0 z-50 shadow-2xl shadow-black/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-all"
                    >
                        <ArrowLeft size={20} />
                        <span>대시보드로 돌아가기</span>
                    </button>

                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="w-1.5 h-8 bg-purple-600 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.5)]"></span>
                        관리자 패널
                    </h1>

                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-all"
                    >
                        <LogOut size={18} />
                        <span className="hidden sm:inline">로그아웃</span>
                    </button>
                </div>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === "all"
                                ? "bg-purple-600 text-white"
                                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                    >
                        전체
                    </button>
                    <button
                        onClick={() => setFilter("pending")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === "pending"
                                ? "bg-yellow-600 text-white"
                                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                    >
                        승인 대기
                    </button>
                    <button
                        onClick={() => setFilter("approved")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === "approved"
                                ? "bg-green-600 text-white"
                                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                    >
                        승인됨
                    </button>
                </div>

                {/* Users Table */}
                <div className="bg-[#151921]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-purple-500" size={40} />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            사용자가 없습니다
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">프로필</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">이름</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">지갑 주소</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">상태</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">가입일</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">작업</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                {user.profile_image_url ? (
                                                    <img
                                                        src={user.profile_image_url}
                                                        alt={user.username}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                                        {user.username[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                                            <td className="px-6 py-4 font-mono text-sm text-gray-400">
                                                {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_approved ? (
                                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                                                        승인됨
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
                                                        대기중
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                {new Date(user.created_at).toLocaleDateString("ko-KR")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!user.is_approved && (
                                                        <button
                                                            onClick={() => handleApprove(user.id)}
                                                            className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all"
                                                            title="승인"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all"
                                                        title="수정"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(user.id)}
                                                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                                                        title="거절/삭제"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#151921] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">사용자 정보 수정</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    사용자 이름
                                </label>
                                <input
                                    type="text"
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    className="w-full px-4 py-2 bg-[#1A1D26] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    지갑 주소
                                </label>
                                <input
                                    type="text"
                                    value={editForm.wallet_address}
                                    onChange={(e) => setEditForm({ ...editForm, wallet_address: e.target.value })}
                                    className="w-full px-4 py-2 bg-[#1A1D26] border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSaveEdit}
                                className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
                            >
                                저장
                            </button>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-lg transition-all"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
