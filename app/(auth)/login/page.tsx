"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useLoggedInUserStore } from "@/store/logged-in-user";
import dbUsers from "@/data/dummy-users.json"
import { useRouter } from "next/navigation";
import { ro } from "date-fns/locale";


export default function LoginPage() {

  const [userCreds, setUserCreds] = useState({email: "", password: ""});
  const [loading, setLoading] = useState(false);
  const router = useRouter()

  const {loginUser} = useLoggedInUserStore()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setUserCreds((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e : any) =>{
    e.preventDefault();
    setLoading(true);
    if(!userCreds.email || !userCreds.password){
      toast.error("Please fill in all fields");
      return setLoading(false);
    }
    // Simulate login delay
    setTimeout(() => {
      // For demo purposes, we just log in with any credentials
      const user = dbUsers.users.find(u => u.userEmail === userCreds.email );
      if(!user){
        toast.error("Invalid email or password");
        setUserCreds({email: "", password: ""});
        setLoading(false);
        return;
      }

      loginUser(user.userEmail, user.userId, user.userRole, user.userPermissions);
      toast.success("Logged in successfully");
      setLoading(false);
      setUserCreds({email: "", password: ""});
      router.push("/dashboard");
    }, 1500);
  }


  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input onChange={handleInputChange} id="email" name="email" value={userCreds.email} type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" onChange={handleInputChange} name="password" value={userCreds.password} type="password" placeholder="••••••••" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full bg-[#BC2030]" type="submit" >
              {loading ? "Logging in..." : "Login"}
              </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don’t have an account?{" "}
              please contact your admin
            </p>
          </CardFooter>
        </Card>
        </form>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:flex flex-1 relative bg-black">
        <Image
          src="/favicon.svg" // Place your image in public folder
          alt="Login side image"
          fill
          className="object-contained w-full h-full"
        />
      </div>
    </div>
  );
}
