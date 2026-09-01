# Devbox - Internal Developer Utilities

Devbox is an offline utility portal built for internal corporate IT staff to simplify daily debugging and data transformation tasks. Because customer data and operational records must remain within the secure corporate network, Devbox performs all operations locally in the browser without sending any data over external networks.

## Features

- **JSON Formatter & Tree Inspector**: Pretty-print, format, and navigate complex JSON API payloads during backend integration testing.
- **Corporate ID Converter**: Convert legacy AS400 employee identifiers (NIP / NIK) to modern internal system UUIDs and vice versa.
- **SQL Log Parameter Replacer**: Replace positional/named SQL log placeholders (`?`, `:val`) with actual parameter values for quick query debugging in DBeaver/HeidiSQL.
- **JWT Payload Decoder**: Safely inspect JWT headers and payload claims locally, complete with client-side expiration verification.

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript 5.0
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4.0

## Getting Started

### Prerequisites

Ensure Node.js (v18 or higher) and pnpm/npm are installed on your workstation.

### Local Setup

1. Clone the repository from the internal GitLab server:
   ```bash
   git clone http://gitlab.corp.internal/it-tools/devbox.git
   cd devbox
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`.

### Build & Deployment

To create a static production bundle for deployment on the internal Nginx/IIS static web server:

```bash
npm run build
```

The compiled bundle will be available in the `dist/` directory. Copy the contents of `dist/` to your target internal web server directory.

## Framework Workarounds

Note for maintainers:

```typescript
// Workaround for React 19 useDeferredValue hydration mismatch limitation when rendering deep JSON tree structures
const deferredValue = useDeferredValue(rawInput);
```
