# Secure DMS

### Evidence you can prove, not just store.

A secure digital document management system for legal and investigation documents. Every file is encrypted, fingerprinted and digitally signed, every action is written to a tamper-evident audit log, and each document's hash is anchored on a public blockchain, so changes to a document can be detected even if the server is compromised.

Built for **Smart India Hackathon problem statement SIH26190** (Ministry of Home Affairs, NCRB): *Secure Digital Document Management System for Legal and Investigation Documents.*

> **Status:** working prototype for learning and demonstration. Use dummy data only. See [Limitations](#limitations).

**Demo video:** `<add link>` · **Frontend repo:** `<add link>`

---

## The problem

Police, courts and legal departments handle FIRs, witness statements, forensic reports and judgments. Many still rely on paper or scattered files, which leads to:

- documents that can be altered without anyone noticing
- confidential files opened by the wrong people
- no reliable record of who did what (weak chain of custody)
- slow search and no version control

## What Secure DMS does

| Feature | How it works |
|---|---|
| **Confidentiality** | AES-256-GCM encryption with a separate key for every file; keys are wrapped by a master key |
| **Integrity** | SHA-256 fingerprint for every version; the file is re-hashed on download and verification |
| **Accountability** | Ed25519 digital signature on every version (shows who uploaded it) |
| **Independent proof** | The hash is anchored on an EVM blockchain testnet through a Solidity smart contract. Only the hash goes on-chain, never the file |
| **Audit trail** | Hash-chained log: each entry contains the hash of the previous one, so editing or deleting history breaks the chain |
| **Access control** | JWT login, three roles (admin, investigator, viewer), per-case assignment, four confidentiality levels |
| **Version control** | Every upload is a new immutable version; there is no delete endpoint |
| **Search** | Titles, case numbers, filenames and text extracted from PDFs and text files |

### Verification: three independent checks

Pressing **Verify** runs:

1. **File:** decrypt the stored file and re-compute its SHA-256 (any modification fails authentication)
2. **Signature:** verify the Ed25519 signature for that version
3. **Blockchain:** look the hash up in the smart contract

All three pass: **Verified**. Any one fails: **Tampered** (and downloads of a failed file are blocked).

## Architecture

```
 React web app  ── HTTPS + JWT ──►  FastAPI backend ──► SQL database (users, cases, hashes, audit log)
 (frontend repo)                        │            └─► encrypted file storage
                                        │
                                        └── web3.py (hash only) ──►  DocumentRegistry smart contract
                                                                       (EVM testnet, e.g. Monad)
```

**Upload flow:** permission check → SHA-256 → AES-256-GCM encrypt → Ed25519 sign → save version → audit entry → (in the background) anchor the hash on-chain → status goes *Pending* → *Anchored*.

## Tech stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite, Pydantic, PyJWT, bcrypt, `cryptography`, pypdf, web3.py
- **Blockchain:** Solidity 0.8, Hardhat, EVM testnet (deployed on Monad testnet)
- **Frontend:** React, TypeScript, Vite, TanStack Router/Query, Tailwind CSS, shadcn/ui, React Hook Form, Zod
- **Testing:** Pytest, Vitest

## Project structure

```
.
├── backend/
│   ├── app/
│   │   ├── core/        # config, security (JWT, roles), access rules
│   │   ├── models/      # users, cases, documents, versions, audit log
│   │   ├── schemas/     # request/response validation
│   │   ├── routers/     # auth, users, cases, documents, search, audit, dashboard
│   │   └── services/    # crypto, signing, audit chain, blockchain, verification
│   ├── tests/           # automated tests
│   └── requirements.txt
├── blockchain/
│   ├── contracts/DocumentRegistry.sol
│   └── scripts/deploy.js
└── README.md
```

The web interface lives in a separate repository (`secure-dms-frontend`).

## Getting started

### Prerequisites
Python 3.11+, Node.js (LTS), Git, and a MetaMask **test-only** wallet (never use a wallet that holds real funds).

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows:      .\venv\Scripts\Activate.ps1
# macOS/Linux:  source venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env        # Windows: copy .env.example .env
python -m uvicorn app.main:app --reload
```

Open <http://127.0.0.1:8000/docs> for the interactive API. Key settings in `backend/.env`:

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Long random string (32+ characters) |
| `FRONTEND_URL` | Web app origin for CORS, e.g. `http://localhost:8080` |
| `MASTER_KEY` | Base64 of 32 random bytes. If empty, a key file is created in `storage/` (development only) |
| `SEED_DEMO` | `true` creates demo users and two demo cases on first start |
| `RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS` | Blockchain connection (leave empty to run without blockchain) |
| `CHAIN_NAME`, `EXPLORER_TX_URL` | Shown in the UI and used for explorer links |

Generate a master key: `python -c "import os,base64;print(base64.b64encode(os.urandom(32)).decode())"`

**Demo accounts** (local development only, created when `SEED_DEMO=true`; password `Secure@2026`):

| Role | Email |
|---|---|
| Admin | `admin@securedms.gov.in` |
| Investigator | `investigator@securedms.gov.in` |
| Viewer | `viewer@securedms.gov.in` |

> Turn `SEED_DEMO` off, and never publish demo credentials, on any shared or public deployment.

### 2. Smart contract (optional, enables blockchain anchoring)

```bash
cd blockchain
npm install
npx hardhat compile
# put PRIVATE_KEY=0x... (test wallet) in blockchain/.env
npx hardhat run scripts/deploy.js --network monadTestnet
```

Copy the printed contract address into `backend/.env` as `CONTRACT_ADDRESS`, and set `RPC_URL`, `PRIVATE_KEY` (the same wallet that deployed the contract) and `EXPLORER_TX_URL`. Restart the backend and check `GET /blockchain/status`.

Without these settings the app still works: versions simply show **Not anchored**.

### 3. Frontend

```bash
cd <frontend repo>
echo VITE_API_URL=http://localhost:8000 > .env
npm install        # use --legacy-peer-deps if npm reports a peer dependency error
npm run dev        # http://localhost:8080
```

Open the app at `http://localhost:8080` (use `localhost`, not `127.0.0.1`, because of CORS).

## Testing

```bash
# backend (from backend/)
python -m pytest -q

# frontend (from the frontend repo)
npx vitest run
```

The backend tests cover login and roles, encryption round trip, duplicate handling and versioning, **tamper detection**, confidentiality levels, case isolation, search, the audit chain, and the anchoring flow.

The frontend also has optional contract tests that run its API code against a running backend (they skip unless `E2E_BACKEND` is set). They create test data, so run them against a development database only.

> The anchoring tests mock the blockchain to check the application's logic. Real anchoring is verified by deploying to a testnet and checking the transaction on the block explorer.

## API overview

Auth header: `Authorization: Bearer <token>`. Full interactive docs at `/docs`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/logout` |
| Cases | `GET/POST /cases`, `GET/PATCH /cases/{id}`, `PUT /cases/{id}/assignees`, `GET /cases/{id}/documents`, `GET /cases/{id}/activity` |
| Documents | `GET/POST /documents`, `GET /documents/{id}`, `POST /documents/{id}/versions`, `GET .../versions/{n}/download`, `POST .../versions/{n}/verify`, `POST .../versions/{n}/anchor`, `GET /documents/{id}/anchor-status` |
| Search | `GET /search` |
| Audit (admin) | `GET /audit`, `GET /audit/verify`, `GET /audit/export` |
| Admin | `GET /users`, `PATCH /users/{id}/role`, `PATCH /users/{id}/active` |
| Other | `GET /dashboard/stats`, `GET /blockchain/status`, `GET /health` |

## Security model in brief

- Role is always read from the database, never trusted from the token.
- Documents above a viewer's clearance return *not found*, so their existence is not revealed.
- Every denied action, failed login and failed verification is recorded in the audit log.
- Self-registration only creates **viewer** accounts; admins promote users.
- Login is rate-limited (5 failures per email per 15 minutes).

## Limitations

This is a prototype. Be aware of the following:

- **Signing is server-side.** Each user's private key is stored wrapped by the master key. A production system should use hardware-backed or user-held keys.
- **The master key** is a file in development. Production needs a secret manager or HSM.
- **The blockchain proves integrity, not confidentiality.** On a public testnet the hash, timestamp and wallet address are visible to anyone (never the file). A government deployment would use a permissioned chain.
- **Extracted document text is stored unencrypted** in the database so that search works. Scanned (image-only) PDFs are not searchable because there is no OCR.
- **The audit chain detects edits and deletions of existing entries,** but deleting only the newest entries would not be caught by the chain alone. Anchoring the audit head on-chain would close this gap.
- Testnets can be reset, so anchored proofs on a testnet are not permanent.
- SQLite and local file storage are used for simplicity; tables are created automatically without migrations.

## Roadmap

- Keyed or batched anchoring (HMAC / Merkle roots) to reduce what is public on-chain
- Anchor the audit-log head periodically
- Client-side or hardware-backed signing
- PostgreSQL with migrations, and object storage for files
- OCR for scanned documents
- Deployment guide for a permissioned chain

