import { redirect } from 'next/navigation';

// The invitation now lives at the root; keep old shared links working.
export default function InvitationRedirect() {
  redirect('/');
}
