import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session: { user?: { name?: string | null; image?: string | null } } | null = null;
  try {
    const { auth } = await import("@/lib/auth");
    session = await auth();
  } catch {
    // DB/auth not available - redirect to login
  }
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader user={session.user} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
