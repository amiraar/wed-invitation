import type { Metadata } from 'next';
import InvitationExperience from '@/components/public/InvitationExperience';
import { getInvitationData } from '@/lib/queries';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ to?: string | string[] }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const { wedding } = await getInvitationData();
  const couple =
    wedding.groom_name && wedding.bride_name
      ? `${wedding.groom_name} & ${wedding.bride_name}`
      : '';
  const title = couple ? `Undangan Pernikahan ${couple}` : 'Undangan Pernikahan';
  const description = couple
    ? `Dengan hormat mengundang Bapak/Ibu/Saudara/i pada pernikahan ${couple}.`
    : 'Undangan pernikahan digital.';

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

export default async function Page({ searchParams }: PageProps) {
  const [{ to }, data] = await Promise.all([searchParams, getInvitationData()]);
  const guestName = typeof to === 'string' ? to.slice(0, 100) : '';

  return <InvitationExperience data={data} guestName={guestName} />;
}
