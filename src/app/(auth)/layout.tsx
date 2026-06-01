export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--os-bg)] text-[var(--os-fg)]">
      {children}
    </div>
  );
}
