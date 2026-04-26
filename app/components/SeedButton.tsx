"use client";

import { useState } from "react";
import { seedMissedPrayers } from "@/app/actions/seed";

export default function SeedButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleSeed() {
    setStatus("loading");
    const count = await seedMissedPrayers();
    setStatus("done");
    console.log(`Seeded ${count} rows`);
  }

  return (
    <button
      onClick={handleSeed}
      disabled={status !== "idle"}
      className="fixed bottom-24 right-4 z-50 text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg shadow-lg disabled:opacity-50"
    >
      {status === "idle" && "Seed DB"}
      {status === "loading" && "Seeding…"}
      {status === "done" && "Done ✓"}
    </button>
  );
}
