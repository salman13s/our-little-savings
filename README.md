# Our Little Savings ♡

*A little place to keep track of something we're building together.*

Our Little Savings is a private-feeling, elegant savings dashboard designed to keep track of deposits over time. It provides a simple overview of the total saved, alongside a chronological history of individual contributions.

Built with React, Supabase, and GitHub Pages.

## Features

- **Savings overview** — automatically calculated total balance in USD.
- **Deposit history** — view individual deposits, dates, and notes.
- **Expandable entries** — see additional details for each deposit.
- **Admin controls** — add, edit, and delete deposits.
- **Read-only viewing** — visitors can see the savings without modifying anything.
- **Optional viewer authentication** — restrict dashboard access to authenticated viewers.
- **Responsive design** — works on desktop and mobile.
- **Free-tier infrastructure** — uses GitHub Pages and Supabase Free.

## Technology

| Component | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | CSS |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Hosting | GitHub Pages |
| Deployment | GitHub Actions |

## Project structure

```text
our-little-savings/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── main.jsx
│   └── style.css
├── supabase/
│   └── schema.sql
├── .env.example
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Getting started

### 1. Requirements

Install:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)

### 2. Clone the repository

```bash
git clone https://github.com/salman13s/our-little-savings.git
cd our-little-savings
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure Supabase

Create a free project at [Supabase](https://supabase.com/).

In your Supabase project:

1. Open **Project Settings → API**.
2. Copy your Project URL.
