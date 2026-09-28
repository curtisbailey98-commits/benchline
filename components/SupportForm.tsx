"use client";

import { useState } from "react";

export function SupportForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setStatus("sending");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          subject: fd.get("subject"),
          message: fd.get("message"),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="name">Name</label>
        <input id="name" name="name" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="subject">Subject</label>
        <input id="subject" name="subject" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="message">Message</label>
        <textarea id="message" name="message" className="input min-h-32" required />
      </div>
      <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
      {status === "sent" ? (
        <p className="text-sm text-success">Got it — we&apos;ll reply by email.</p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm text-danger">Something went wrong. Email support directly if this persists.</p>
      ) : null}
    </form>
  );
}
