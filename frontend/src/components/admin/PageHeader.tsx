"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "./Icons";

export default function PageHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <header className="page-header">
      <button className="back" onClick={() => router.back()} aria-label="Go back">
        <ArrowLeftIcon />
      </button>
      <h1 style={{ margin: 0, fontSize: "inherit", fontWeight: 400 }}>{title}</h1>
    </header>
  );
}
