import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Payment successful" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  return (
    <div className="container-page py-20">
      <div className="card mx-auto max-w-lg text-center">
        <p className="badge">Paid</p>
        <h1 className="mt-4 text-3xl font-semibold">You&apos;re in</h1>
        <p className="mt-3 text-muted">
          Stripe confirmed your checkout
          {session_id ? " session" : ""}. After the webhook marks the order paid,
          downloads appear in your account for Core Kit purchases.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/account" className="btn btn-primary">
            Go to account
          </Link>
          <Link href="/shop" className="btn btn-secondary">
            Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}
