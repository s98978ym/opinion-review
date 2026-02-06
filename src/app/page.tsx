import { redirect } from "next/navigation";

export default async function Home() {
  let isAuthenticated = false;
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    isAuthenticated = !!session?.user;
  } catch {
    // DB/auth not available - fall through to login redirect
  }

  if (isAuthenticated) {
    redirect("/channels");
  }
  redirect("/login");
}
