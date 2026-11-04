import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabaseConfig } from "@/lib/db/pool";

export default async function LoginPage() {
  if (!hasDatabaseConfig()) redirect("/");
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-20 pt-8 sm:px-8">
      <AuthForm mode="login" />
    </div>
  );
}
