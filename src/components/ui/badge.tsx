import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantClasses = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
};

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    CHECKED_IN: { label: "Checked In", variant: "success" },
    CHECKED_OUT: { label: "Checked Out", variant: "default" },
    CANCELLED: { label: "Cancelled", variant: "danger" },
    PENDING: { label: "Pending", variant: "warning" },
    ACCEPTED: { label: "Accepted", variant: "info" },
    REJECTED: { label: "Rejected", variant: "danger" },
    EXPIRED: { label: "Expired", variant: "default" },
  };
  const { label, variant } = config[status] ?? { label: status, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}
