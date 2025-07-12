import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const backendBaseURL = import.meta.env.VITE_BACKEND_BASE_URL.endsWith("/")
    ? import.meta.env.VITE_BACKEND_BASE_URL.slice(0, -1)
    : import.meta.env.VITE_BACKEND_BASE_URL;

  console.log(backendBaseURL);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${backendBaseURL}/signup`,
        {
          username,
          email,
          password,
        }
      );
      localStorage.setItem("token", response.data.token);
      toast({
        title: "Signup Successful",
        description: "Welcome to YT2Blog!",
      });
      navigate("/");
    } catch (error) {
      console.log(error);
      toast({
        title: "Signup Failed",
        description: "Please try again with different username.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center">Sign Up</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Sign Up
          </Button>
        </form>
        <p className="text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
