import type { Metadata } from "next";
import Link from "next/link";
import PlansList from "@/components/PlansList";
import PlanFormContainer from "./PlanFormContainer";

export const metadata: Metadata = {
  title: "Планы и идеи",
};

export default function PlansPage() {
  return (
    <main className="min-h-screen text-[#3d332c] dark:text-[#fcf8ef] p-6 pb-24 font-sans flex flex-col items-center">
      <div className="w-full max-w-md mx-auto flex flex-col items-center mt-6">
        <h2 className="text-3xl font-extrabold mb-6">Наши планы 🗓️</h2>

        <PlanFormContainer />

        <PlansList />

        <Link
          href="/"
          className="mt-10 text-sm opacity-60 hover:opacity-100 font-bold underline mb-10 text-[#9e6b36] dark:text-[#cca573] decoration-2 underline-offset-4"
        >
          На главную 🏡
        </Link>
      </div>
    </main>
  );
}