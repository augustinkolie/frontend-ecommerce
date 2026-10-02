import { apiAuthed } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { Profile } from "./profile";

export const metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await apiAuthed<User>("/me");
  return <Profile user={user} />;
}
