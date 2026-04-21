import CleaningPlanCard from "@/components/CleaningPlanCard";
import CastingsCard from "@/components/CastingsCard";
import BirthdaysCard from "@/components/BirthdaysCard";
import { useAuth } from "@/lib/AuthContext";

export default function AdminPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <section className="mb-2">
        <p className="font-label text-sm uppercase tracking-[0.15em] text-primary font-semibold mb-1">
          Welcome back,
        </p>
        <h2 className="font-headline text-3xl font-bold italic tracking-tight leading-[1.1]">
          {firstName}
        </h2>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CleaningPlanCard />

        <BirthdaysCard />
          <CastingsCard />
      </div>
    </div>
  );
}
