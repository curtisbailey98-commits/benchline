import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Checkout canceled" };

export default function CancelPage() {
  return (
    <div className="container-page py-20">
      <div className="card mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-semibold">Checkout canceled</h1>
        <p className="mt-3 text-muted">
          No charge was made. Anything you added to your cart is still saved in this browser.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/#pricing" className="btn btn-primary">
            Back to pricing
          </Link>
          <Link href="/cart" className="btn btn-secondary">
            View cart
          </Link>
          <Link href="/contact" className="btn btn-secondary">
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
