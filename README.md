# Lumine AI 

A production-grade specialized RAG (Retrieval Augmented Generation) platform enabling semantic search and conversational intelligence over PDF documents. Built with a focus on vector scalability, edge compatibility, and type-safe infrastructure.

## Architecture & Tech Stack

### Core Infrastructure

- **Framework**: Next.js 14 (App Router) - Utilizing Server Actions & React Server Components (RSC).
- **Language**: TypeScript - Strict type safety across full stack (Zod validation where applicable).
- **Styling**: Tailwind CSS + `shadcn/ui` (Radix Primitives) + `clsx`/`tailwind-merge` for conditional class composition.
- **ORM**: Drizzle ORM - Lightweight, edge-compatible SQL query builder.
- **Database**: PostgreSQL (Neon/Supabase compatible) for relational data (`chats`, `messages`, `user_subscriptions`).
- **Vector Database**: Pinecone - Serverless vector index for high-dimensional embedding storage.
- **File Storage**: AWS S3 - Scalable object storage for raw PDF documents.

### Key Engineering Decisions

#### 1. Vector Processing Pipeline (`/lib/pinecone.ts`)

Instead of simple text upload, we implemented a robust ETL pipeline for PDF ingestion:

1.  **Ingestion**: Files are uploaded to S3 via presigned URLs (ensuring client-direct uploads to reduce server load).
2.  **Server-Side Processing**: On chat creation, the file is downloaded to the `/tmp` directory (Edge runtime compatible ephemeral storage).
3.  **Parsing & Chunking**:
    - Utilized `@langchain/community/document_loaders/fs/pdf` for robust PDF text extraction.
    - Implemented `RecursiveCharacterTextSplitter` from `@pinecone-database/doc-splitter` to chunk text with context-aware boundaries, optimizing for LLM context windows.
    - **Optimization**: Strings are truncated to 36,000 bytes to prevent metadata overflow in vector stores.
4.  **Embedding Generation**:
    - Model: `text-embedding-ada-002` via `openai-edge`.
    - **Dimensionality Reduction**: Configured to 1536 dimensions for best results.
5.  **Vector Upsert**:
    - Vectors are upserted into **Namespaced** Pinecone indices.
    - Namespace Strategy: `md5` hash of the file key/content ensures collision-free multi-tenancy within a single index.

#### 2. RAG & Inference Engine (`/app/api/chat/route.ts`)

- **Context Retrieval**: Queries Pinecone for `topK: 5` most similar vectors using cosine similarity.
- **Prompt Engineering**: Dynamically injects retrieved context into a system prompt block, forcing the LLM to strictly adhere to the provided source material (reducing hallucinations).
- **Streaming Response**:
  - leveraged Vercel AI SDK (`ai` package) `OpenAIStream` for real-time token streaming.
  - `StreamingTextResponse` allows for immediate TTB (Time to First Byte), significantly improving UX over traditional request-response models.
- **Chat History**: Messages are persisted in Postgres (via Drizzle) for session continuity but fed into the LLM context window selectively to manage token limits.

#### 3. Payment Infrastructure (`/lib/stripe.ts` & Webhooks)

- Implemented a robust subscription model using Stripe.
- **Webhook Handling**: Critical infrastructure in `/api/webhook` handles asynchronous events (`checkout.session.completed`, `invoice.payment_succeeded`).
- **Security**: Webhook signatures are verified using `stripe.webhooks.constructEvent` to prevent replay attacks or forged requests.
- **State Sync**: Database subscription status (`stripe_current_period_end`) is strictly synchronized with Stripe events to enforce gatekeeping middleware.

#### 4. Frontend Optimization

- **Optimistic UI**: `@tanstack/react-query` is used for fetching chat history (`/api/get-messages`), enabling caching and instant loading states.
- **Client-Side Navigation**: `react-dropzone` integration with `useMutation` hooks provides real-time upload progress feedback.
- **PDF Visualization**: Embedded Google Docs Viewer in an iframe for a lightweight, cross-browser compatible PDF rendering solution without heavy client-side libraries.

## Environment Variables

The application relies on strict environment configuration for security and service integration:

```env
# Database
DATABASE_URL=postgresql://...

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI & Vector
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
PINECONE_INDEX_NAME=...

# Storage (AWS)
NEXT_PUBLIC_S3_BUCKET_NAME=...
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=...
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=...
NEXT_PUBLIC_AWS_REGION=us-east-1

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SIGNING_SECRET=whsec_...
NEXT_BASE_URL=http://localhost:3000
```

## Getting Started

1.  **Clone & Install**:
    ```bash
    git clone [repo]
    npm install
    ```
2.  **Database Migration**:
    ```bash
    npx drizzle-kit push:pg
    ```
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

---

_Architected for scalability, maintainability, and performance._
