"use client";
import WelcomeMessage from "./WelcomeMessage";
import { ReactNode } from "react";

export default function MessagesClient({ children }: { children: ReactNode }) {
  return (
    <>
      <WelcomeMessage />
      {children}
    </>
  );
}
