import type { Metadata } from 'next';
import InvitationExperience from '@/components/public/InvitationExperience';
import { getInvitationData } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { wedding } = await getInvitationData();
  const couple =
    wedding.groom_name && wedding.bride_name
      ? `${wedding.groom_name} & ${wedding.bride_name}`
      : '';
  const title = couple ? `The Wedding of ${couple}` : 'Wedding Invitation';
  const description = couple
    ? `You're warmly invited to celebrate the wedding of ${couple}.`
    : 'A digital wedding invitation.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(wedding.cover_image_url ? { images: [wedding.cover_image_url] } : {})
    }
  };
}

export default async function Page() {
  const data = await getInvitationData();
  return <InvitationExperience data={data} />;
}
