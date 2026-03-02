"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/services/api";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [organizationName, setOrganizationName] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const data = await registerUser({ name, email, password, organizationName });

            if (data.token) {
                localStorage.setItem("token", data.token);
                toast.success("Registered successfully!");
                router.push("/dashboard");
            } else {
                toast.error("Registration failed");
            }
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Circles */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">

                {/* Premium Gradient Base */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b1220] via-[#0f172a] to-[#111827]" />

                {/* Subtle Radial Glow (Top Left) */}
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />

                {/* Subtle Radial Glow (Bottom Right) */}
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[120px]" />

                {/* Soft Center Highlight */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 blur-[150px] rounded-full" />

                {/* Professional Grid Overlay */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                        backgroundSize: "80px 80px",
                    }}
                />
            </div>

            {/* Login Card */}
            <div className="relative w-full max-w-105 transition-all duration-700 ease-out opacity-100 translate-y-0">
                <div className="relative rounded-2xl border border-white/8 bg-gray-900/75 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7)] overflow-hidden p-8">
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-4">
                        Welcome back
                    </h1>
                    <p className="text-gray-400 text-sm mb-6">
                        Enter your credentials to continue
                    </p>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="text-gray-300 text-sm font-medium mb-1 block">
                                Name
                            </label>
                            <Input
                                type="name"
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-11 rounded-xl bg-gray-800/60 border-gray-700/80 text-white placeholder:text-gray-600 focus-visible:ring-violet-500/40 focus-visible:border-violet-500 transition-all w-full"
                            />
                        </div>
                        <div>
                            <label className="text-gray-300 text-sm font-medium mb-1 block">
                                Organization Name
                            </label>
                            <Input
                                type="text"
                                placeholder="Organization Name"
                                value={organizationName}
                                onChange={(e) => setOrganizationName(e.target.value)}
                                className="h-11 rounded-xl bg-gray-800/60 border-gray-700/80 text-white placeholder:text-gray-600 focus-visible:ring-violet-500/40 focus-visible:border-violet-500 transition-all w-full"
                            />
                        </div>
                        <div>
                            <label className="text-gray-300 text-sm font-medium mb-1 block">
                                Email address
                            </label>
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 rounded-xl bg-gray-800/60 border-gray-700/80 text-white placeholder:text-gray-600 focus-visible:ring-violet-500/40 focus-visible:border-violet-500 transition-all w-full"
                            />
                        </div>

                        <div>
                            <label className="text-gray-300 text-sm font-medium mb-1 block">
                                Password
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11 rounded-xl bg-gray-800/60 border-gray-700/80 text-white placeholder:text-gray-600 focus-visible:ring-violet-500/40 focus-visible:border-violet-500 transition-all w-full"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 mt-2 rounded-xl bg-linear-to-r from-red-500 via-violet-500 to-blue-600 hover:from-red-600 hover:via-violet-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-500/35 hover:scale-[1.015] active:scale-[0.99]"
                        >
                            Signup
                        </Button>
                        <div className="pt-4">
                            <div className="relative flex items-center gap-3 py-2">
                                <div className="flex-1 bg-gray-700" />
                                <span className="text-gray-600 text-xs">or</span>
                                <div className="flex-1 bg-gray-700" />
                            </div>

                            <div className="mt-3 flex items-center justify-between bg-gray-800/40 p-3 rounded-xl">
                                <p className="text-gray-400 text-sm">
                                    Already have account?
                                </p>
                                <Link
                                    href="/login"
                                    className="text-sm font-semibold text-violet-400 flex items-center gap-1 group"
                                >
                                    Login
                                    <span className="w-4 h-4 group-hover:translate-x-1 transition" />
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}