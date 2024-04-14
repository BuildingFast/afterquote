# Afterquote

## Tech Stack

- [Next.js](https://nextjs.org/) - Framework
- [Prisma](https://www.prisma.io/) - ORM
- [Tailwind](https://tailwindcss.com/) - CSS
- [shadcn/ui](https://ui.shadcn.com/) - Component Library
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [react-email](https://react.email/) - Email Templates
- [tRPC](https://trpc.io/) - API
- [React-PDF](https://github.com/wojtekmaj/react-pdf) - Viewing PDFs
- [Vercel](https://vercel.com) - Hosting

# Local Development

**Want to get up and running quickly? Follow these steps:**

1. Fork this GitHub repository to your account
- Create a .env locally and fill in the required environment variables

2. Set up your `.env` file using the recommendations in the `.env.example` file. Alternatively, run `cp .env.example .env` to get started with our defaults.

3. Install packages
```sh
yarn install
```

4. Build project
```sh
yarn dev
```

## Setup Cypress Testing

- Create `cypress.env.json` (check out - `cypress.example.env.json`)
- To open the cypress UI.
```sh
yarn cypress
```

## Making a change to prisma.schema ([Running migrations](<[url](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate)>))

- To change the database schema, modify prisma.schema
- After making any changes to prisma.schema, run the command 
```sh npx prisma migrate dev``` and then enter a suitable name for the changes made

## Prettier linting command

```sh
npx prettier --write ./src
```


## Custom Field JSON Structure

### Example custom field Structure

```json
{
  "Customer Information": { "Customer code": "string", ... },
  "Shipping Information": { "Clearing Agent": "string", ... },
  "Payment & Delivery Details": { "Delivery Date": "date", ... },
  "Additional Remarks": { "Remarks": "string" }
}
```

### Data Types

- **String:** Text-based fields.
- **Date:** Fields in a standard date format.
- **Array:** Used for the "Container Type" field with predefined options.

### Usage

This JSON structure defines custom fields for shipping, payment, and customer details. Ensure to validate the JSON against this structure and handle data types appropriately within your application.

## Custom Checklist List in Org Table

`{
"B/L": false,
"Insurance": false,
"Packing list": false,
"Product Labels": false,
"Commercial Invoice": false,
"Certificate of Origin": false,
"Certificate of Analysis": false
}`

### Usage

This array defines a checklist for each quote.

## Database backup from Neon from the command line (with postgresql@14) -

```
pg_dump db_connection_string > backup.sql
```

## Dump Database from local to database provider

pg_dump --dbname="postgresql://username:postgres@localhost:5432/tigerdb" > "backup_sep30_from_local.sql"

psql "<prod-url>" -a -f "backup_sep30_from_local.sql"
