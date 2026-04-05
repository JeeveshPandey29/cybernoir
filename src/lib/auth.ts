import { getServerSession } from "next-auth";
import { unstable_noStore as noStore } from "next/cache";
import { authOptions } from "@/lib/auth-options";
import { getUserByEmail } from "@/lib/db";

export async function getCurrentUser() {
  noStore();
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return getUserByEmail(email);
}
