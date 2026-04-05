import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '@/lib/server-session';
import { notFound } from 'next/navigation';
import { ProfileClient } from '@/components/pages/ProfileClient';

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
