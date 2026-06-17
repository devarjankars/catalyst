"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useLoggedInUserStore } from "@/store/logged-in-user";
import dbUsers from "@/data/dummy-users.json";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [userCreds, setUserCreds] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { loginUser } = useLoggedInUserStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setUserCreds((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setLoading(true);
    if (!userCreds.email || !userCreds.password) {
      toast.error("Please fill in all fields");
      return setLoading(false);
    }
    const user = dbUsers.users.find(
      (u) => u.userEmail === userCreds.email && u.userpassword === userCreds.password
    );
    if (!user) {
      toast.error("Invalid email or password");
      setUserCreds({ email: "", password: "" });
      setLoading(false);
      return;
    }
    sessionStorage.setItem(
      "auth",
      JSON.stringify({ userEmail: user.userEmail, userpassword: user.userpassword })
    );
    loginUser(user.userEmail, user.userpassword, user.userId, user.userRole, user.userPermissions);
    toast.success("Logged in successfully");
    router.push("/dashboard");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/banner.jpg')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo/Branding */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-[#BC2030] grid place-items-center shadow-lg mb-3">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-wide">Email Builder</h1>
          <p className="text-white/70 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 space-y-5">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-white/90 text-sm font-medium">
                Email Address
              </Label>
              <Input
                onChange={handleInputChange}
                id="email"
                name="email"
                value={userCreds.email}
                type="email"
                placeholder="you@example.com"
                className="bg-white/15 border-white/30 text-white placeholder:text-white/40 focus:border-white/60 focus:bg-white/20 transition-all"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-white/90 text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                onChange={handleInputChange}
                name="password"
                value={userCreds.password}
                type="password"
                placeholder="••••••••"
                className="bg-white/15 border-white/30 text-white placeholder:text-white/40 focus:border-white/60 focus:bg-white/20 transition-all"
              />
            </div>
            <Button
              className="w-full bg-[#BC2030] hover:bg-[#9e1a28] text-white font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg mt-2"
              type="submit"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-white/50 text-xs text-center">
              Don&apos;t have an account? Please contact your admin.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
