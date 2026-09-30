import Link from "next/link";
import { KITS } from "@/lib/kits";
import { formatPrice, getProductById } from "@/lib/products";

function coreFileCounts() {
  const files = KITS["core-kit"].files.map((f) => f.file);
  return {
    total: files.length,
    md: files.filter((f) => f.endsWith(".md")).length,
    xlsx: files.filter((f) => f.endsWith(".xlsx")).length,
    csv: files.filter((f) => f.endsWith(".csv")).length,
  };
}

export function getFaqs(): Array<{ q: string; a: React.ReactNode; text: string }> {
  const c = coreFileCounts();
  const core = formatPrice(getProductById("core-kit")!.priceCents);
  const pro = formatPrice(getProductById("updates")!.priceCents);
  const items: Array<{ q: string; a: string; link?: { href: string; label: string } }> = [
    {
      q: "What exactly do I receive?",
      a: `A ZIP download with ${c.total} files organized into seven business systems: ${c.md} Markdown documents (the Start Here guide, pricing guide, scripts, estimate template, checklists, and review and money routines), ${c.xlsx} XLSX spreadsheets with working formulas (a job pricing calculator and a weekly money dashboard), and ${c.csv} CSV rate sheet. The full list is on the Core Kit page.`,
      link: { href: "/shop/core-kit", label: "See every file" },
    },
    {
      q: "Is Benchline software?",
      a: "No. Benchline is a set of files you download and own — no app to install, no login needed to use them. Your Benchline account is only for downloading your purchases.",
    },
    {
      q: "Do I need Notion?",
      a: "No. The Markdown files import into Notion (Import → Markdown & CSV) if you like Notion, but nothing requires it.",
    },
    {
      q: "Can I use the files without Notion?",
      a: "Yes. Markdown files are plain text: open them in any text editor, or paste them into Google Docs, Word, or your notes app. The spreadsheets open in Excel, Google Sheets, LibreOffice, or Numbers. Print the checklists for the truck.",
    },
    {
      q: "Who is it designed for?",
      a: "Solo home-service operators — cleaners, pressure washers, lawn-care operators, mobile detailers, handymen, and similar businesses — who are good at the work and want the business side to run more professionally.",
    },
    {
      q: "Can I customize the templates?",
      a: "Yes, everything is editable. Replace the [brackets] with your details, change the wording, and set your own prices. The license covers use in your own business; please don't resell the files.",
    },
    {
      q: "How quickly can I start?",
      a: "Right away. The download is available as soon as your payment is confirmed, and the Start Here guide walks you through a first week of short setup steps (about 15–45 minutes each), starting with setting your prices.",
    },
    {
      q: "What happens after I purchase?",
      a: "You pay on Stripe's secure checkout, then land on a confirmation page. Sign in to your Benchline account with the same email you used at checkout (we'll email you a sign-in link) and your downloads are waiting. If payment is still processing, it can take a minute to appear.",
    },
    {
      q: "Is Pro required?",
      a: `No. The Core Kit (${core}, one-time) is complete on its own. Benchline Pro (${pro}/month) is optional for owners who want ongoing tools.`,
    },
    {
      q: "Can I cancel Pro?",
      a: "Yes, anytime — from your account (Manage billing) or through the contact form. Pro renews monthly until you cancel, and you keep access through the end of the month you paid for. The 3 Pro months in the Core + 3 Months Pro bundle are prepaid and never auto-renew.",
      link: { href: "/terms#subscriptions", label: "Renewal & cancellation terms" },
    },
    {
      q: "Is this bookkeeping or accounting software?",
      a: "No. The Weekly Money Dashboard is a simple spreadsheet that shows money in, expenses, job profit, and what you kept. It doesn't replace bookkeeping software, an accountant, or tax advice.",
    },
    {
      q: "Does it replace a CRM?",
      a: "No. Benchline gives you the scripts, templates, checklists, and routines. Use them with your phone, email, and whatever scheduling or invoicing app you already have — or none at all.",
    },
    {
      q: "What file formats are included?",
      a: "Markdown (.md), Excel spreadsheets (.xlsx), and CSV (.csv), delivered as a ZIP file. There are no PDFs or videos; you can print any document from your editor.",
    },
    {
      q: "Can I get a refund?",
      a: "Because files are delivered instantly, refunds are limited — but if a download fails or you were charged in error, we'll fix it or refund you.",
      link: { href: "/refunds", label: "Refund policy" },
    },
  ];
  return items.map((i) => ({
    q: i.q,
    text: i.a,
    a: (
      <>
        {i.a}
        {i.link ? (
          <>
            {" "}
            <Link href={i.link.href} className="text-steel underline">
              {i.link.label}
            </Link>
          </>
        ) : null}
      </>
    ),
  }));
}

export function FAQ() {
  return (
    <div className="space-y-3">
      {getFaqs().map((item) => (
        <details key={item.q} className="group card !py-4 open:border-steel/40">
          <summary className="cursor-pointer list-none font-medium marker:content-none">
            <span className="flex items-center justify-between gap-4">
              {item.q}
              <span className="text-steel transition group-open:rotate-45" aria-hidden>+</span>
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
