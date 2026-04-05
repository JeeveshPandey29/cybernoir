import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "@/components/site/profile-form";

export const metadata = {
  title: "Profile",
  description: "Manage your CYBERNOIR profile",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Account</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">Profile settings</h1>
        <p className="mt-2 text-sm text-muted">
          Update your display name and avatar URL for comments and your reader profile.
        </p>
      </div>
      <ProfileForm
        user={{
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          bio: user.bio,
          websiteUrl: user.websiteUrl,
          xUrl: user.xUrl,
          linkedinUrl: user.linkedinUrl,
        }}
      />
    </main>
  );
}

