import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const account = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
  if (!account) redirect("/api/clear-session");
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar user={session.user} />
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
