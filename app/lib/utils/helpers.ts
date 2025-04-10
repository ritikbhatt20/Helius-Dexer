/* eslint-disable */
export interface ReserveData {
  protocol: string;
  address: string;
  tokenMint: string;
  tokenSymbol: string;
  availableAmount: number;
  borrowApy: number;
  ltvRatio: number;
  liquidationThreshold: number;
  liquidationPenalty: number;
}

export interface PoolData {
  tokenMint: string;
  tokenSymbol: string;
  dex: string;
  poolAddress: string;
  priceUsd: number;
  volume24h: number;
  liquidityUsd: number;
}

export function extractReserveDataFromTransactions(
  transactions: any[],
  protocols: string[],
  reserveAddresses: string[]
): ReserveData[] {
  const reserveData: ReserveData[] = [];

  for (const tx of transactions) {
    // Simplified example - actual implementation would need to:
    // 1. Parse instruction data specific to each lending protocol
    // 2. Match against known program IDs
    // 3. Extract reserve update events
    if (tx.type === "LENDING_POOL_UPDATE" && tx.events?.lending) {
      const { reserve } = tx.events.lending;
      if (
        reserve &&
        protocols.includes(reserve.protocol) &&
        (!reserveAddresses.length || reserveAddresses.includes(reserve.address))
      ) {
        reserveData.push({
          protocol: reserve.protocol,
          address: reserve.address,
          tokenMint: reserve.tokenMint,
          tokenSymbol: reserve.tokenSymbol || "UNKNOWN",
          availableAmount: reserve.availableAmount,
          borrowApy: reserve.borrowApy,
          ltvRatio: reserve.ltvRatio,
          liquidationThreshold: reserve.liquidationThreshold,
          liquidationPenalty: reserve.liquidationPenalty,
        });
      }
    }
  }

  return reserveData;
}

export function extractPoolDataFromTransactions(
  transactions: any[]
): PoolData[] {
  const poolData: PoolData[] = [];

  for (const tx of transactions) {
    // Simplified example - actual implementation would need to:
    // 1. Parse swap instructions
    // 2. Identify DEX programs (Raydium, Orca, etc.)
    // 3. Calculate prices from pool states
    if (tx.type === "SWAP" && tx.events?.swap) {
      const { swap } = tx.events.swap;
      if (swap && swap.poolAddress) {
        poolData.push({
          tokenMint: swap.tokenMint,
          tokenSymbol: swap.tokenSymbol || "UNKNOWN",
          dex: swap.dex || "unknown",
          poolAddress: swap.poolAddress,
          priceUsd: swap.priceUsd || 0,
          volume24h: swap.volume24h || 0,
          liquidityUsd: swap.liquidityUsd || 0,
        });
      }
    }
  }

  return poolData;
}
