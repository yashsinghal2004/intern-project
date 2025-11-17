# Plinko Game

A provably fair Plinko game built with Next.js, TypeScript, and Prisma.

## How to Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/plinko?schema=public"
   ```
   
   For local development with SQLite (optional):
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. **Setup database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Start server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Architecture

```
Frontend (React/Next.js)
    ↓
API Routes (/api/rounds, /api/verify)
    ↓
Business Logic (Crypto, PRNG, Plinko Engine)
    ↓
Database (Prisma/PostgreSQL)
```

**Key Files:**
- `lib/crypto.ts` - SHA256 hashing, seed generation
- `lib/prng.ts` - Xorshift32 PRNG
- `lib/plinko-engine.ts` - Deterministic game logic
- `app/api/rounds/` - Round management API
- `app/verify/` - Public verifier page

## Fairness Specification

### Commit-Reveal Protocol

1. **Commit**: `commitHex = SHA256(serverSeed + ":" + nonce)` (published before round)
2. **Start**: `combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)`
3. **Reveal**: Server reveals `serverSeed` after round completes

### PRNG

- **Algorithm**: Xorshift32
- **Seed**: First 4 bytes of `combinedSeed` (hex to uint32)
- **Output**: Float [0, 1) via `(state >>> 0) / 0x100000000`

### Rounding

- Peg bias rounded to 6 decimal places: `roundTo6Decimals(value)`
- Bias range: `[0.4, 0.6]` (formula: `0.5 + (rand() - 0.5) * 0.2`)

### Peg Map Rules

- 12 rows, 13 bins (0-12)
- Each peg: `leftBias ∈ [0.4, 0.6]` from PRNG
- Drop column adjustment: `adj = (dropColumn - 6) * 0.01`
- Decision: `if (PRNG.next() < leftBias + adj) → Left, else → Right`
- Final bin: `binIndex = number of Right moves`

## AI Usage

**Where used:**
- Initial project setup and structure
- Core logic (commit-reveal, PRNG, Plinko engine)
- Frontend components (Canvas board, animations)
- Unit tests

**Key changes made:**
- Fixed animation restart bugs
- Improved state management
- Simplified UI/UX
- Updated color scheme for dark theme

## Time Log

- Setup: ~1h
- Backend: ~2h
- Frontend: ~3h
- Testing: ~1h
- Polish: ~1.5h
- Docs: ~30min

**Total: ~9 hours**

## Next Steps

1. Real-time updates (WebSocket)
2. Statistics dashboard
3. CSV export
4. Mobile optimization
5. WebGL rendering
6. Advanced verification features

## Links

- **Live App**: [Deploy URL]
- **Verifier**: `/verify`
- **Example Round**: `/api/rounds/[roundId]`

## Testing

```bash
npm test
```

Tests cover: crypto functions, PRNG determinism, Plinko engine.
"# intern-project" 
