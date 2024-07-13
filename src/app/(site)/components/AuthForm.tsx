"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { BsGithub, BsGoogle } from "react-icons/bs";

import Button from "@/app/components/Button";
import Input from "@/app/components/inputs/Input";
import AuthSocialButton from "./AuthSociaButton";

type Variant = "LOGIN" | "REGISTER";

const AuthForm = () => {
  const session = useSession();
  const router = useRouter();
  const [variant, setVariant] = useState<Variant>("LOGIN");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.status === "authenticated") {
      router.push("/users");
    }
  }, [session?.status, router]);

  const toggleVariant = useCallback(() => {
    setVariant((prevVariant) => prevVariant === "LOGIN" ? "REGISTER" : "LOGIN");
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    setIsLoading(true);
    try {
      if (variant === "REGISTER") {
        await axios.post("/api/register", data);
        const result = await signIn("credentials", {
          ...data,
          redirect: false,
        });
        if (result?.error) {
          toast.error("Registration failed");
        } else if (result?.ok) {
          toast.success("Registered successfully");
          router.push("/users");
        }
      } else {
        const result = await signIn("credentials", {
          ...data,
          redirect: false,
        });
        if (result?.error) {
          toast.error("Invalid credentials");
        } else if (result?.ok) {
          toast.success("Logged in");
          router.push("/users");
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const socialAction = useCallback(async (action: string) => {
    setIsLoading(true);
    try {
      const callback = await signIn(action, { redirect: false });
      if (callback?.error) {
        toast.error("Invalid credentials");
      } else if (callback?.ok) {
        toast.success("Logged in");
        router.push("/users");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const socialButtons = useMemo(() => [
    { icon: BsGithub, action: "github" },
    { icon: BsGoogle, action: "google" }
  ], []);

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {variant === "REGISTER" && (
            <Input id="name" label="Name" register={register} errors={errors} disabled={isLoading} />
          )}
          <Input id="email" label="Email Address" type="email" register={register} errors={errors} disabled={isLoading} />
          <Input id="password" label="Password" type="password" register={register} errors={errors} disabled={isLoading} />
          <Button disabled={isLoading} fullWidth type="submit">
            {variant === "LOGIN" ? "Sign in" : "Register"}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or Continue With</span>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            {socialButtons.map(({ icon, action }) => (
              <AuthSocialButton key={action} icon={icon} onClick={() => socialAction(action)} />
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-center text-sm mt-6 px-2 text-gray-500">
          <div>{variant === "LOGIN" ? "New to Messenger?" : "Already have an account?"}</div>
          <div onClick={toggleVariant} className="underline cursor-pointer">
            {variant === "LOGIN" ? "Create an account" : "Login"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;