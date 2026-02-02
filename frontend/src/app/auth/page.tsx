"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/auth";
import { UserPlus, LogIn, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import SceneProvider from "@/components/SceneProvider";
import dynamic from "next/dynamic";

// Dynamic import for 3D components (client-side only)
const HamsterCanvas = dynamic(() => import("@/components/HamsterCanvas"), { ssr: false });
const Hamster = dynamic(() => import("@/components/Hamster"), { ssr: false });

export default function AuthPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Login form state
    const [loginData, setLoginData] = useState({
        username: "",
        password: "",
    });

    // Signup form state
    const [signupData, setSignupData] = useState({
        username: "",
        password: "",
        wallet_address: "",
        profile_image: null as File | null,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(loginData.username, loginData.password);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "로그인에 실패했습니다");
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("username", signupData.username);
            formData.append("password", signupData.password);
            formData.append("wallet_address", signupData.wallet_address);
            if (signupData.profile_image) {
                formData.append("profile_image", signupData.profile_image);
            }

            const result = await register(formData);
            setSuccess(result.message);

            // Reset form
            setSignupData({
                username: "",
                password: "",
                wallet_address: "",
                profile_image: null,
            });
            setImagePreview(null);
        } catch (err: any) {
            setError(err.message || "가입 신청에 실패했습니다");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSignupData({ ...signupData, profile_image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <main className="min-h-screen text-gray-200 font-sans flex flex-col items-center justify-center relative overflow-hidden">
            {/* 3D Sakura Hamster World Background */}
            <SceneProvider />

            {/* MOBILE ONLY: 2 Hamsters at Top (Elderly & Jab) */}
            <div className="relative w-full h-[25vh] z-20 flex justify-center items-end gap-4 lg:hidden pointer-events-none">
                {/* Elderly Hamster - Left */}
                <div className="w-[45%] h-full overflow-visible">
                    <HamsterCanvas>
                        <Hamster
                            fileName="Meshy_AI_Animation_Elderly_Shaky_Walk_inplace_withSkin.glb"
                            scale={1.2}
                            position={[-1, -1.5, 0]}
                        />
                    </HamsterCanvas>
                </div>
                {/* Jab Hamster - Right */}
                <div className="w-[45%] h-full overflow-visible">
                    <HamsterCanvas>
                        <Hamster
                            fileName="Meshy_AI_Animation_Right_Jab_from_Guard_withSkin.glb"
                            scale={1.2}
                            position={[1, -1.5, 0]}
                        />
                    </HamsterCanvas>
                </div>
            </div>

            {/* DESKTOP ONLY: 5 Hamsters on sides (unchanged) */}
            {/* 3D Hamster - Top Left (Walking) */}
            <div className="fixed left-0 top-0 w-[410px] h-[50vh] z-20 hidden lg:block overflow-visible">
                <HamsterCanvas>
                    <Hamster
                        fileName="Meshy_AI_Animation_Walking_withSkin.glb"
                        scale={1.5}
                        position={[0, -2, 0]}
                    />
                </HamsterCanvas>
            </div>

            {/* 3D Hamster - Bottom Left (Running) */}
            <div className="fixed left-0 bottom-0 w-[410px] h-[50vh] z-20 hidden lg:block overflow-visible">
                <HamsterCanvas>
                    <Hamster
                        fileName="Meshy_AI_Animation_Running_withSkin.glb"
                        scale={1.5}
                        position={[0, -2, 0]}
                    />
                </HamsterCanvas>
            </div>

            {/* 3D Hamster - Top Right (Elderly) */}
            <div className="fixed right-0 top-0 w-[410px] h-[50vh] z-20 hidden lg:block overflow-visible">
                <HamsterCanvas>
                    <Hamster
                        fileName="Meshy_AI_Animation_Elderly_Shaky_Walk_inplace_withSkin.glb"
                        scale={1.5}
                        position={[0, -2, 0]}
                    />
                </HamsterCanvas>
            </div>

            {/* 3D Hamster - Bottom Right (Jab) */}
            <div className="fixed right-0 bottom-0 w-[410px] h-[50vh] z-20 hidden lg:block overflow-visible">
                <HamsterCanvas>
                    <Hamster
                        fileName="Meshy_AI_Animation_Right_Jab_from_Guard_withSkin.glb"
                        scale={1.5}
                        position={[0, -2, 0]}
                    />
                </HamsterCanvas>
            </div>

            <div className="relative z-10 w-full max-w-md px-4">
                {/* Logo with Hamster */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className="relative w-20 h-20">
                            <Image
                                src="/logo.png"
                                alt="Blockblock Logo"
                                fill
                                className="object-contain drop-shadow-2xl"
                                priority
                            />
                        </div>
                        {/* Jumping Hamster next to Logo - Desktop Only */}
                        <div className="w-[200px] h-[200px] overflow-visible hidden lg:block">
                            <HamsterCanvas>
                                <Hamster
                                    fileName="Meshy_AI_Animation_jumping_jacks_withSkin.glb"
                                    scale={1.5}
                                    position={[0, -2, 0]}
                                />
                            </HamsterCanvas>
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter">
                        Blockblock
                    </h1>
                    <p className="text-sm text-blue-500 font-bold tracking-widest uppercase">
                        Trading Competition
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-[#151921]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => {
                                setActiveTab("login");
                                setError("");
                                setSuccess("");
                            }}
                            className={`flex-1 py-4 px-6 font-semibold transition-all ${activeTab === "login"
                                ? "bg-blue-600/20 text-blue-400 border-b-2 border-blue-500"
                                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                                }`}
                        >
                            <LogIn className="inline-block mr-2" size={18} />
                            로그인
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("signup");
                                setError("");
                                setSuccess("");
                            }}
                            className={`flex-1 py-4 px-6 font-semibold transition-all ${activeTab === "signup"
                                ? "bg-purple-600/20 text-purple-400 border-b-2 border-purple-500"
                                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                                }`}
                        >
                            <UserPlus className="inline-block mr-2" size={18} />
                            가입신청
                        </button>
                    </div>

                    {/* Form Content */}
                    <div className="p-6">
                        {/* Error/Success Messages */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                                {success}
                            </div>
                        )}

                        {/* Login Form */}
                        {activeTab === "login" && (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        사용자 이름 (ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={loginData.username}
                                        onChange={(e) =>
                                            setLoginData({ ...loginData, username: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-[#1A1D26] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="이름을 입력하세요"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        비밀번호 (4자리 숫자)
                                    </label>
                                    <input
                                        type="password"
                                        value={loginData.password}
                                        onChange={(e) =>
                                            setLoginData({ ...loginData, password: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-[#1A1D26] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="4자리 숫자"
                                        maxLength={4}
                                        pattern="\d{4}"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            로그인 중...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn size={18} />
                                            로그인
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Signup Form */}
                        {activeTab === "signup" && (
                            <form onSubmit={handleSignup} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        사용자 이름 (ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={signupData.username}
                                        onChange={(e) =>
                                            setSignupData({ ...signupData, username: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-[#1A1D26] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                        placeholder="이름을 입력하세요"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        비밀번호 (4자리 숫자)
                                    </label>
                                    <input
                                        type="password"
                                        value={signupData.password}
                                        onChange={(e) =>
                                            setSignupData({ ...signupData, password: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-[#1A1D26] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                        placeholder="4자리 숫자"
                                        maxLength={4}
                                        pattern="\d{4}"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        지갑 주소
                                    </label>
                                    <input
                                        type="text"
                                        value={signupData.wallet_address}
                                        onChange={(e) =>
                                            setSignupData({
                                                ...signupData,
                                                wallet_address: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-3 bg-[#1A1D26] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm"
                                        placeholder="0x..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        프로필 사진 (선택)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        {imagePreview && (
                                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <label className="flex-1 cursor-pointer">
                                            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1A1D26] border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-purple-500 transition-all">
                                                <Upload size={18} />
                                                <span className="text-sm">
                                                    {signupData.profile_image
                                                        ? signupData.profile_image.name
                                                        : "이미지 업로드"}
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all active:scale-95 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            신청 중...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            가입 신청
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    관리자 승인 후 로그인이 가능합니다
                </p>
            </div>
        </main>
    );
}
