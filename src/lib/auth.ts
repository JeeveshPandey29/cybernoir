import { getServerSession } from "next-auth";
import { unstable_noStore as noStore } from "next/cache";
import { authOptions } from "@/lib/auth-options";
import { getUserByEmail } from "@/lib/db";

export async function getCurrentUser() {
  noStore();
  let session: Awaited<ReturnType<typeof getServerSession>>;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Failed to load auth session:", error);
    return null;
  }
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  try {
    return await getUserByEmail(email);
  } catch (error) {
    console.error("Failed to load current user by email:", error);
    return null;
  }
}
