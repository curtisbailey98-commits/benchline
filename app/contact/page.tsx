import type { Metadata } from "next";
import { SupportForm } from "@/components/SupportForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-semibold">Contact & support</h1>
      <p className="mt-3 max-w-xl text-muted">
        Questions about delivery, billing, or the kits? Send a message — it creates a support ticket
        in our system.
      </p>
      <div className="mt-8 max-w-xl">
        <SupportForm />
      </div>
    </div>
  );
}
