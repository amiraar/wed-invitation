import Navbar from '@/components/public/Navbar';

export default function InvitationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Navbar />
      {children}
    </div>
  );
}
