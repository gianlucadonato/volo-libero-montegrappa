import type { Viewport } from "next";
import Login from "@/components/auth/Login";
import { constructMetadata } from "@/config/site";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = constructMetadata({
  title: "Login",
  description: "Login to your account",
});

export default function LoginPage() {
  return (
    <div className="container mx-auto flex h-screen w-full flex-col items-center justify-center">
      <div className="mt-[-20%] w-full">
        <Login />
      </div>
    </div>
  );
}
