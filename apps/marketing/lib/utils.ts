import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number): string {
  const date = new Date(input)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

// export function absoluteUrl(path: string) {
//   // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
//   return `${NEXT_PUBLIC_APP_URL}${path}`
// }
