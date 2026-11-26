import { SampleDayCard } from "./_components/sample-day-card";
import { HomeActions } from "./_components/home-actions";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <p className="text-lg font-bold" translate="no">
        mr-dan<span className="text-teal-600">.</span>
      </p>

      <h1 className="mt-6 text-3xl font-bold text-balance">
        برنامهٔ امروزت، همین‌جا.
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        تکلیف‌ها، برنامهٔ مطالعه، وقت آزاد و تغذیه — بدون دفتر و
        یادداشت‌های پراکنده.
      </p>

      <SampleDayCard />

      <HomeActions />
    </main>
  );
}
