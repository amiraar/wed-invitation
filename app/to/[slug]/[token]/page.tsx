import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import InvitationExperience from '@/components/public/InvitationExperience';
import { getInvitationData } from '@/lib/queries';
import { getGuestByToken, guestPath, slugify } from '@/lib/guests';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string; token: string }> };

// Personal invitations must never show up in search engines.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const [guest, { wedding }] = await Promise.all([getGuestByToken(token), getInvitationData()]);
  const couple = wedding.groom_name && wedding.bride_name ? `${wedding.groom_name} & ${wedding.bride_name}` : '';
  const title = couple ? `The Wedding of ${couple}` : 'Wedding Invitation';
  const description = guest ? `A personal invitation for ${guest.name}.` : 'A digital wedding invitation.';
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      ...(wedding.cover_image_url ? { images: [wedding.cover_image_url] } : {})
    }
  };
}

export default async function PersonalInvitationPage({ params }: Props) {
  const { slug, token } = await params;
  // Lookup is by token only; notFound/redirect stay outside getInvitationData's try/catch.
  const guest = await getGuestByToken(token);
  if (!guest) notFound();
  if (slug !== slugify(guest.name)) redirect(guestPath(guest));

  const data = await getInvitationData();
  const { id: _id, ...guestView } = guest;
  return <InvitationExperience data={data} guest={guestView} />;
}
