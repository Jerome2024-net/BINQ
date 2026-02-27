import { NextResponse } from "next/server";

let cachedPrice: { price: number; change24h: number; timestamp: number } | null = null;
const CACHE_DURATION = 30_000; // 30 seconds

export async function GET() {
  try {
    // Return cached price if fresh
    if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        price: cachedPrice.price,
        change24h: cachedPrice.change24h,
        devise: "EUR",
        cached: true,
      });
    }

    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur&include_24hr_change=true",
      { next: { revalidate: 30 } }
    );

    if (!res.ok) {
      // If API fails, return cached or fallback
      if (cachedPrice) {
        return NextResponse.json({
          price: cachedPrice.price,
          change24h: cachedPrice.change24h,
          devise: "EUR",
          cached: true,
        });
      }
      throw new Error("CoinGecko API error");
    }

    const data = await res.json();
    const price = data.bitcoin.eur;
    const change24h = Math.round((data.bitcoin.eur_24h_change || 0) * 100) / 100;

    cachedPrice = { price, change24h, timestamp: Date.now() };

    return NextResponse.json({
      price,
      change24h,
      devise: "EUR",
      cached: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de récupérer le prix BTC" },
      { status: 500 }
    );
  }
}
