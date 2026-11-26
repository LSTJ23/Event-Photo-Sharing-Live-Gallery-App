import { redirect } from "next/navigation";
import { expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

it("opens the portal rather than the in-app scanner", () => {
  Home();
  expect(redirect).toHaveBeenCalledWith("/portal");
});
