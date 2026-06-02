import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, XIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const alertVariants = cva(
  "relative flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default:
          "border-info/20 bg-info/5 text-info [&_svg]:text-info",
        destructive:
          "border-destructive/20 bg-destructive/5 text-destructive [&_svg]:text-destructive",
        success:
          "border-success/20 bg-success/5 text-success [&_svg]:text-success",
        warning:
          "border-warning/20 bg-warning/5 text-warning [&_svg]:text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const alertIconMap = {
  default: InfoIcon,
  destructive: TriangleAlertIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
} as const

function Alert({
  className,
  variant = "default",
  title,
  children,
  onClose,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    title?: string
    onClose?: () => void
  }) {
  const Icon = alertIconMap[variant ?? "default"]
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="text-sm opacity-90">{children}</div>}
      </div>
      {onClose && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          className="-mr-1 -mt-1 shrink-0 self-start"
        >
          <XIcon className="size-3" />
          <span className="sr-only">Close</span>
        </Button>
      )}
    </div>
  )
}

export { Alert, alertVariants }
