import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Link, Redirect, useLocation, useSearch } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { navigate } from "wouter/use-browser-location";

const Login = () => {
  const [email, setEmail] = useState(""); // State for email
  const [password, setPassword] = useState(""); // State for password

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Send JSON
        },
        body: JSON.stringify({ email, password }), // Convert to JSON
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Login failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      toast.success("Logged in successfully");
      navigate("/"); // Redirect to home page after successful login
    },
    onError: (error: any) => {
      toast.error(error.message || "Something went wrong");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    loginMutation.mutate({ email, password }); // Pass email and password to mutation
  };

  return (
    <div className="bg-transparent shadow-lg p-8 rounded-lg w-full max-w-md">
      <h2 className="mb-6 font-bold text-2xl text-center">Login</h2>
      <form className="space-y-6">
        <div>
          <Label htmlFor="email" className="block font-medium text-gray-700 text-sm">
            Email
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={email} // Bind email state to input
            required
            onChange={(e) => setEmail(e.target.value)} // Update email state
          />
        </div>
        <div>
          <Label htmlFor="password" className="block font-medium text-gray-700 text-sm">
            Password
          </Label>
          <Input
            type="password"
            id="password"
            name="password"
            value={password} // Bind password state to input
            required
            onChange={(e) => setPassword(e.target.value)} // Update password state
          />
        </div>
        <Button
          type="submit"
          onClick={handleSubmit} // Handle form submission
          disabled={loginMutation.isPending} // Disable button while loading
          className="flex justify-center items-center bg-primary hover:bg-slate-600 px-4 py-2 border border-transparent rounded-md focus:outline-none focus:ring-offset-2 w-full font-medium text-white text-sm"
        >
          Sign in
        </Button>
      </form>
      <div className="mt-4 text-center">
        <span className="text-gray-700 text-sm">Don't have an account? </span>
        <Link href="/signup" className="text-sky-500 text-sm hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
};

export const Signup = () => {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const signupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Signup failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Signup successful. Check your email for verification.");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    signupMutation.mutate();
  };

  return (
    <div className="bg-transparent shadow-lg p-8 rounded-lg w-full max-w-md">
      <h2 className="mb-6 font-bold text-2xl text-center">Signup</h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email" className="block font-medium text-gray-700 text-sm">
            Email
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="password" className="block font-medium text-gray-700 text-sm">
            Password
          </Label>
          <Input
            type="password"
            id="password"
            name="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="reenter-password" className="block font-medium text-gray-700 text-sm">
            Re-enter Password
          </Label>
          <Input
            type="password"
            id="reenter-password"
            name="reenter-password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          />
        </div>
        <Button
          type="submit"
          disabled={signupMutation.isPending}
          className="flex justify-center items-center bg-primary hover:bg-slate-600 px-4 py-2 border border-transparent rounded-md focus:outline-none focus:ring-offset-2 w-full font-medium text-white text-sm"
        >
          {signupMutation.isPending ? "Signing up..." : "Sign up"}
        </Button>
      </form>
      <div className="mt-4 text-center">
        <span className="text-gray-700 text-sm">Already have an account? </span>
        <a href="/login" className="text-sky-500 text-sm hover:underline">
          Sign in
        </a>
      </div>
    </div>
  );
};

export const VerifyEmail = () => {
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:8000/verify-email?token=${token}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Email verification failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Email verified successfully.");
      setTimeout(() => setLocation("/"), 2000);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    console.log("Token:", token);
    if (token) verifyMutation.mutate();
  }, [token]);

  return <div className="mt-10 font-bold text-center">Verifying your email...</div>;
};

export default Login;
