interface ProfileSectionProps {
  title: string
  children: React.ReactNode
}

export default function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  )
} 