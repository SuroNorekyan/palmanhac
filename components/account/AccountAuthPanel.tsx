"use client";

import { useMemo, useState, useTransition } from "react";
import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import type { Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { withLocale } from "@/lib/utils/locale";

type AuthMode = "login" | "register";

export function AccountAuthPanel({
  dictionary,
  locale,
  callbackUrl,
  initialMode = "login",
}: {
  dictionary: Dictionary;
  locale: Locale;
  callbackUrl: string;
  initialMode?: AuthMode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    register: false,
    confirm: false,
    login: false,
  });

  const toggleMode = () => setMode((value) => (value === "login" ? "register" : "login"));

  const redirectUrl = useMemo(
    () => callbackUrl || withLocale(locale, "/account"),
    [callbackUrl, locale],
  );

  const updateField =
    (field: "name" | "email" | "password" | "confirmPassword") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleLogin = () => {
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
        callbackUrl: redirectUrl,
      });

      if (result?.error) {
        toast({
          title: dictionary.account.alerts.loginFailed,
          variant: "destructive",
        });
        return;
      }

      router.push(result?.url ?? redirectUrl);
      router.refresh();
    });
  };

  const handleRegister = () => {
    if (form.password !== form.confirmPassword) {
      toast({
        title: dictionary.account.alerts.passwordMismatch,
        description: dictionary.account.passwordHint,
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      if (!response.ok) {
        toast({
          title: dictionary.account.alerts.registrationFailed,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: dictionary.account.alerts.registrationSuccess,
        variant: "success",
      });
      setMode("login");
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === "login") {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const signInWithGoogle = () => {
    void signIn("google", { callbackUrl: redirectUrl });
  };

  const togglePasswordVisibility = (field: "register" | "confirm" | "login") => {
    setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const renderPasswordInput = (
    props: ComponentProps<typeof Input> & { field: "register" | "confirm" | "login" },
  ) => {
    const { field, ...inputProps } = props;
    const isVisible = passwordVisibility[field];
    return (
      <div className="relative">
        <Input {...inputProps} type={isVisible ? "text" : "password"} className="pr-11" />
        <button
          type="button"
          className="absolute inset-y-0 right-3 flex items-center text-neutral-500 hover:text-neutral-900"
          onClick={() => togglePasswordVisibility(field)}
          aria-pressed={isVisible}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="sr-only">{isVisible ? "Hide password" : "Show password"}</span>
        </button>
      </div>
    );
  };

  return (
    <section className="mx-auto max-w-xl space-y-8 rounded-3xl border border-[rgb(var(--border))] bg-white p-8 shadow-sm">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">
          {dictionary.account.heading}
        </h1>
        <p className="text-sm text-neutral-600">{dictionary.account.subheading}</p>
      </header>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "register" ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="account-name">{dictionary.account.name}</Label>
              <Input
                id="account-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={updateField("name")}
              />
            </div>
            <div>
              <Label htmlFor="account-email">{dictionary.account.email}</Label>
              <Input
                id="account-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={updateField("email")}
              />
            </div>
            <div>
              <Label htmlFor="account-password">{dictionary.account.password}</Label>
              {renderPasswordInput({
                id: "account-password",
                name: "password",
                autoComplete: "new-password",
                required: true,
                value: form.password,
                onChange: updateField("password"),
                field: "register",
              })}
            </div>
            <div>
              <Label htmlFor="account-confirm">
                {dictionary.account.confirmPassword}
              </Label>
              {renderPasswordInput({
                id: "account-confirm",
                name: "confirmPassword",
                autoComplete: "new-password",
                required: true,
                value: form.confirmPassword,
                onChange: updateField("confirmPassword"),
                field: "confirm",
              })}
            </div>
            <p className="text-xs text-neutral-500">{dictionary.account.passwordHint}</p>
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="account-email">{dictionary.account.email}</Label>
              <Input
                id="account-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={updateField("email")}
              />
            </div>
            <div>
              <Label htmlFor="account-password">{dictionary.account.password}</Label>
              {renderPasswordInput({
                id: "account-password",
                name: "password",
                autoComplete: "current-password",
                required: true,
                value: form.password,
                onChange: updateField("password"),
                field: "login",
              })}
            </div>
          </>
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {mode === "login" ? dictionary.account.login : dictionary.account.createAccount}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={signInWithGoogle}
        >
          {dictionary.account.googleSignIn}
        </Button>
      </form>
      <footer className="text-center text-sm text-neutral-500">
        <button
          type="button"
          onClick={toggleMode}
          className="font-medium text-neutral-800 underline-offset-4 hover:underline"
        >
          {mode === "login"
            ? dictionary.account.noAccountCta
            : dictionary.account.hasAccountCta}
        </button>
      </footer>
    </section>
  );
}
