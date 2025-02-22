import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Link } from "wouter";

const Login = () => {
  return (
    <div className="bg-transparent shadow-lg p-8 rounded-lg w-full max-w-md">
      <h2 className="mb-6 font-bold text-2xl text-center">Login</h2>
      <form className="space-y-6">
        <div>
          <Label htmlFor="email" className="block font-medium text-gray-700 text-sm">
            Email/Username
          </Label>
          <Input type="email" id="email" name="email" required />
        </div>
        <div>
          <Label htmlFor="password" className="block font-medium text-gray-700 text-sm">
            Password
          </Label>
          <Input type="password" id="password" name="password" required />
        </div>
        <Button
          type="submit"
          className="flex justify-center items-center bg-primary hover:bg-slate-600 px-4 py-2 border border-transparent rounded-md focus:ring-offset-2 w-full font-medium text-sm text-white focus:outline-none"
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
          <Label htmlFor="email" className="block font-medium text-gray-700 text-sm">
            Username
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
          className="flex justify-center items-center bg-primary hover:bg-slate-600 px-4 py-2 border border-transparent rounded-md focus:ring-offset-2 w-full font-medium text-sm text-white focus:outline-none"
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
