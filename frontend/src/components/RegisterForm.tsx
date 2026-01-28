"use client";

import { useState, useRef, FormEvent, ChangeEvent } from "react";
import { X, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface RegisterFormProps {
    isOpen: boolean;
    onClose: () => void;
    apiUrl: string;
}

export default function RegisterForm({ isOpen, onClose, apiUrl }: RegisterFormProps) {
    const [nickname, setNickname] = useState("");
    const [walletAddress, setWalletAddress] = useState("");
    const [twitterHandle, setTwitterHandle] = useState("");
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
            if (!allowed.includes(file.type)) {
                setError("JPG, PNG, GIF, WebP 이미지만 업로드 가능합니다");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError("이미지 크기는 5MB 이하여야 합니다");
                return;
            }

            setProfileImage(file);
            setError(null);

            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setProfileImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!nickname.trim()) {
            setError("닉네임을 입력해주세요");
            return;
        }
        if (nickname.length < 2 || nickname.length > 50) {
            setError("닉네임은 2~50자여야 합니다");
            return;
        }

        if (!walletAddress.trim()) {
            setError("지갑 주소를 입력해주세요");
            return;
        }
        const walletRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!walletRegex.test(walletAddress)) {
            setError("올바른 지갑 주소 형식이 아닙니다 (0x로 시작하는 42자리)");
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("nickname", nickname.trim());
            formData.append("wallet_address", walletAddress.toLowerCase());
            if (twitterHandle.trim()) {
                formData.append("twitter_handle", twitterHandle.trim());
            }
            if (profileImage) {
                formData.append("profile_image", profileImage);
            }

            const response = await fetch(`${apiUrl}/api/register`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "참가 신청에 실패했습니다");
            }

            setSuccess(data.message || "참가 신청이 완료되었습니다!");

            setNickname("");
            setWalletAddress("");
            setTwitterHandle("");
            removeImage();

            setTimeout(() => {
                onClose();
                setSuccess(null);
            }, 3000);

        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-[#1A1D26] border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">🚀 참가 신청</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {success && (
                        <div className="flex items-center gap-3 p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <p className="text-green-400 text-sm">{success}</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="flex flex-col items-center">
                        <div
                            className="relative w-24 h-24 cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="프로필 미리보기" className="w-full h-full rounded-full object-cover border-2 border-blue-500" />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </>
                            ) : (
                                <div className="w-full h-full rounded-full bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center group-hover:border-blue-500 transition-colors">
                                    <Upload className="w-6 h-6 text-gray-500 mb-1" />
                                    <span className="text-xs text-gray-500">이미지</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <p className="text-xs text-gray-500 mt-2">프로필 이미지 (선택)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            닉네임 <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="리더보드에 표시될 이름"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            maxLength={50}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Hyperliquid 지갑 주소 <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            placeholder="0x..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
                            maxLength={42}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            트위터/X (선택)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                            <input
                                type="text"
                                value={twitterHandle}
                                onChange={(e) => setTwitterHandle(e.target.value)}
                                placeholder="username"
                                className="w-full px-4 py-3 pl-8 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                maxLength={50}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 rounded-xl font-bold text-white transition-all ${isLoading
                                ? "bg-gray-600 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                신청 중...
                            </span>
                        ) : (
                            "참가 신청하기"
                        )}
                    </button>

                    <div className="p-4 bg-white/5 rounded-xl">
                        <p className="text-xs text-gray-400 leading-relaxed">
                            📌 참가 신청 시 현재 자산이 초기 자산으로 기록됩니다.<br />
                            📌 수익률은 (현재자산 - 초기자산) / 초기자산 × 100 으로 계산됩니다.<br />
                            📌 리더보드는 실시간으로 업데이트됩니다.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
