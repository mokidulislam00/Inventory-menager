# Inventory Dashboard (Next.js)

## Setup

1. Install dependencies:

       npm install

2. Copy `.env.example` to `.env.local` and set `MONGODB_URI` to your MongoDB connection string. For a local MongoDB server, the example URI works as-is. For MongoDB Atlas, use the connection string from your cluster and replace its username, password, and database name.

3. Start the app:

       npm run dev

Open http://localhost:3000. The app connects to MongoDB through its API routes; starter inventory is added once to an empty database. Set or update each item's sale price in the Items tab. Sales orders prefill that unit price, allow an order-specific price change, and deduct quantities from inventory in the same MongoDB transaction. Deleting an order restores its quantities to stock and removes it from sales reports in one transaction. The dashboard and Reports tab summarize saved sales.
