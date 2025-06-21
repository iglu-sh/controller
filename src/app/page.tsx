import Link from "next/link";

import { LatestPost } from "@/app/_components/post";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import {Button} from "@/components/ui/button";
import { redirect } from 'next/navigation'
export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    redirect("/app")
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main className="max-w-[800px] mx-auto p-4 flex flex-col gap-4 items-center justify-center h-screen">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold">
              Hello there!
            </h1>
            Please login to continue
          </div>
          <Link href={"/api/auth/signin"}>
            <Button>
              Go to Login
            </Button>
          </Link>
      </main>
    </HydrateClient>
  );
}
