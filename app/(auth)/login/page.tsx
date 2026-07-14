"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useLoggedInUserStore } from "@/store/logged-in-user";
import dbUsers from "@/data/dummy-users.json";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  const [userCreds, setUserCreds] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { loginUser } = useLoggedInUserStore();
    const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
    router.push("/");
  };

 return (
    <div className="min-h-screen flex">
      <div className="w-full bg-[url('/bg-login.png')] bg-cover bg-no-repeat  h-full overflow-hidden flex flex-col lg:flex-row">

        {/* ── LEFT PANEL ── */}
        <div className="w-full lg:w-1/2 min-h-screen  flex flex-col justify-center p-9 px-12 max-md:px-6 max-md:p-7">

          {/* Logo */}
          <div className="flex mx-auto w-[65%] items-center gap-2.5 mb-14 max-md:mb-8">
            <img src="/catalyst_logo.png" className="w-[50%]"/>
          </div>

          {/* Form Card */}
          <Card className=" mx-auto w-[65%] min-h-[60vh] max-w-[634px] pt-8 px-4 max-h-[641px] flex flex-col bg-transparent  bg-clip-padding  rounded-2xl backdrop-filter backdrop-blur-md bg-opacity-10 border border-[#4a4a4add]">
            <CardContent className="p-8 flex flex-col gap-5">

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <h1 className="text-2xl font-semibold text-white tracking-tight">
                  Sign in to your account
                </h1>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-[13px] font-medium text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={userCreds.email}
                    onChange={handleInputChange}
                    type="email"
                    placeholder="sellostore@company.com"
                    className="border-[#5e5e5e] text-white bg-transparent text-sm placeholder:text-[#aaa]  focus-visible:border-white rounded-lg h-10 "
                  />
                </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-[13px] font-medium text-white">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    onChange={handleInputChange}
                    placeholder="5ellostore."
                    className="border-[#5e5e5e] text-white bg-transparent text-sm placeholder:text-[#aaa]  focus-visible:border-white rounded-lg h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] transition-colors"
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(val) => setRememberMe(!!val)}
                    className="border-[#ccc] data-[state=checked]:bg-[#E12A29] data-[state=checked]:border-[#E12A29] rounded-[3px] w-4 h-4"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-[13px] text-[#555] font-normal cursor-pointer"
                  >
                    Remember Me
                  </Label>
                </div>
               
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-[#E12A29] hover:bg-[#c82120] text-white font-semibold text-[15px] h-11 rounded-lg"
              >
                {loading ? "Signing in..." : "Log In"}
              </Button>

              {/* Contact */}
              <p className="text-center text-[13px] text-[#888] mt-5">
                Don&apos;t Have An Account?{" "}
                <a href="#" className="text-[#E12A29] font-medium hover:underline">
                  Please Contact Your Admin
                </a>
              </p>
            </form>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT PANEL: VIDEO ── */}
        <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center ">

          
            {/* Replace the orb below with your video: */}
            <video
              autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-[100% 100%]"
            >
              <source src="/Orb2.mp4" type="video/mp4" />
            </video>
         

          {/* Placeholder orb — remove when adding video */}
          {/* <div className="w-[300px] h-[300px] rounded-full bg-[radial-gradient(ellipse_at_35%_35%,#E12A29_0%,#8b0000_45%,#1a0000_80%,transparent_100%)] shadow-[0_0_80px_rgba(225,42,41,0.25)] animate-pulse max-md:w-[180px] max-md:h-[180px]" /> */}

          {/* Tagline */}
          {/* <div className="absolute bottom-16 left-0 right-0 text-center text-[26px] font-black tracking-tight max-md:text-[18px] max-md:bottom-12">
            <span className="text-white">A TO Z. </span>
            <span className="text-[#555]">WE DO IN AI.</span>
          </div> */}

          {/* Medtrix branding */}
          {/* <div className="absolute bottom-5 right-5 flex items-center gap-2">
            <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none">
              <rect x="10" y="2" width="8" height="24" rx="2" fill="#E12A29" />
              <rect x="2" y="10" width="24" height="8" rx="2" fill="#E12A29" />
              <rect x="10" y="10" width="8" height="8" rx="1" fill="#c82120" />
            </svg>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold text-white tracking-tight">
                medtrix
              </span>
              <span className="text-[8px] font-medium text-[#555] tracking-widest uppercase">
                Catalyzing Healthcare
              </span>
            </div>
          </div> */}

        </div>
    </div>
  </div>
  );
}
