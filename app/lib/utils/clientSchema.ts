const clientSchemas = {
  nft_bids: `
      CREATE TABLE IF NOT EXISTS \${tableName} (
        id SERIAL PRIMARY KEY,
        marketplace VARCHAR(100) NOT NULL,
        auction_house VARCHAR(100),
        token_address VARCHAR(44) NOT NULL,
        token_mint VARCHAR(44) NOT NULL,
        buyer VARCHAR(44) NOT NULL,
        price BIGINT NOT NULL,
        token_size INTEGER,
        expiry TIMESTAMP,
        bid_id VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_marketplace_bid UNIQUE (marketplace, bid_id)
      );
    `,
  nft_prices: `
      CREATE TABLE IF NOT EXISTS \${tableName} (
        id SERIAL PRIMARY KEY,
        marketplace VARCHAR(100) NOT NULL,
        token_address VARCHAR(44) NOT NULL,
        token_mint VARCHAR(44) NOT NULL,
        collection_address VARCHAR(44),
        price_lamports BIGINT NOT NULL,
        price_usd DECIMAL(15,2),
        seller VARCHAR(44) NOT NULL,
        listing_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_marketplace_listing UNIQUE (marketplace, listing_id)
      );
    `,
  token_borrowing: `
      CREATE TABLE IF NOT EXISTS \${tableName} (
        id SERIAL PRIMARY KEY,
        protocol VARCHAR(100) NOT NULL,
        reserve_address VARCHAR(44) NOT NULL,
        token_mint VARCHAR(44) NOT NULL,
        token_symbol VARCHAR(20),
        available_amount BIGINT NOT NULL,
        borrow_apy DECIMAL(5,2),
        ltv_ratio DECIMAL(5,2),
        liquidation_threshold DECIMAL(5,2),
        liquidation_penalty DECIMAL(5,2),
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_protocol_reserve UNIQUE (protocol, reserve_address)
      );
    `,
  token_prices: `
      CREATE TABLE IF NOT EXISTS \${tableName} (
        id SERIAL PRIMARY KEY,
        token_mint VARCHAR(44) NOT NULL,
        token_symbol VARCHAR(20),
        dex VARCHAR(100) NOT NULL,
        pool_address VARCHAR(44) NOT NULL,
        price_usd DECIMAL(15,2) NOT NULL,
        volume_24h DECIMAL(15,2),
        liquidity_usd DECIMAL(15,2),
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_dex_pool UNIQUE (dex, pool_address)
      );
    `,
};

export default clientSchemas;
