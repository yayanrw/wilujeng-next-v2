import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '@/lib/server-session';
import { ProfileClient } from '@/components/pages/ProfileClient';
import { notFound } from 'next/navigation';

export default async function ProfilePage() {
  const session = await requireSession();
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    notFound();
  }

  return <ProfileClient user={user} />;
}
