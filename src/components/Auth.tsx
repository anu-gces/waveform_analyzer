import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Link, Redirect } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
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
  return (
    <div className="bg-transparent shadow-lg p-8 rounded-lg w-full max-w-md">
      <h2 className="mb-6 font-bold text-2xl text-center">Signup</h2>
      <form className="space-y-6">
        <div>
          <Label htmlFor="email" className="block font-medium text-gray-700 text-sm">
            Email
          </Label>
          <Input type="email" id="email" name="email" required />
        </div>
        <div>
          <Label htmlFor="password" className="block font-medium text-gray-700 text-sm">
            Password
          </Label>
          <Input type="password" id="password" name="password" required />
        </div>
        <div>
          <Label htmlFor="reenter-password" className="block font-medium text-gray-700 text-sm">
            Re-enter Password
          </Label>
          <Input type="password" id="reenter-password" name="reenter-password" required />
        </div>
        <Button
          type="submit"
          className="flex justify-center items-center bg-primary hover:bg-slate-600 px-4 py-2 border border-transparent rounded-md focus:outline-none focus:ring-offset-2 w-full font-medium text-white text-sm"
        >
          Sign up
        </Button>
      </form>
      <div className="mt-4 text-center">
        <span className="text-gray-700 text-sm">Already have an account? </span>
        <Link href="/login" className="text-sky-500 text-sm hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Login;
