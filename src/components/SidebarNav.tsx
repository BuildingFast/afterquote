import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/utils";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "h-10 justify-start rounded-md px-4 py-2 hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
