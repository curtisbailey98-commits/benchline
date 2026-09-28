export type DashboardAggregates = {
  revenueCents: number;
  orderCount: number;
  customerCount: number;
  paidOrderCount: number;
  productBreakdown: Array<{ name: string; units: number; revenueCents: number }>;
  openTickets: number;
  recentOrders: Array<{ id: string; email: string; totalCents: number; status: string; createdAt: string }>;
};

export function ruleBasedSummary(data: DashboardAggregates): string {
  const revenue = (data.revenueCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  const aov =
    data.paidOrderCount > 0
      ? (data.revenueCents / data.paidOrderCount / 100).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
      : "$0.00";

  const top =
    data.productBreakdown.length > 0
      ? [...data.productBreakdown].sort((a, b) => b.revenueCents - a.revenueCents)[0]
      : null;

  const lines = [
    `Revenue (paid orders): ${revenue} across ${data.paidOrderCount} paid order(s).`,
    `Customers: ${data.customerCount}. Average order value: ${aov}.`,
    top
      ? `Top product by revenue: ${top.name} (${top.units} unit(s), $${(top.revenueCents / 100).toFixed(2)}).`
      : "No product sales recorded yet.",
    `Open support tickets: ${data.openTickets}.`,
  ];

  if (data.paidOrderCount === 0) {
    lines.push(
      "No paid orders yet — focus on activating Stripe prices, shipping the Core Kit PDP, and capturing abandoned carts."
    );
  } else if (data.openTickets > 0) {
    lines.push("Clear open support tickets before pushing more paid acquisition.");
  } else {
    lines.push("Ops look clean. Consider featuring the Core + Updates bundle on the homepage.");
  }

  return lines.join(" ");
}

export async function summarizeDashboard(data: DashboardAggregates): Promise<{
  summary: string;
  source: "openai" | "rules";
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { summary: ruleBasedSummary(data), source: "rules" };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a concise e-commerce analyst for Benchline. Summarize ONLY from the JSON aggregates provided. Never invent metrics, testimonials, or forecasts. 4-6 short sentences.",
          },
          {
            role: "user",
            content: JSON.stringify(data),
          },
        ],
      }),
    });

    if (!res.ok) {
      return { summary: ruleBasedSummary(data), source: "rules" };
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return { summary: ruleBasedSummary(data), source: "rules" };
    }
    return { summary: text, source: "openai" };
  } catch {
    return { summary: ruleBasedSummary(data), source: "rules" };
  }
}
