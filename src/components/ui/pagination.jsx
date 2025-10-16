import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"

const Pagination = ({ className, ...props }) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center p-4", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("flex flex-row items-center gap-2", className)} {...props} />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

const PaginationPrevious = ({ className, disabled = false, ...props }) => (
  <button
    aria-label="Go to previous page"
    disabled={disabled}
    className={cn(
      "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
      "bg-white border border-gray-300 text-gray-700 rounded-md",
      "hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed",
      "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
      className
    )}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </button>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({ className, disabled = false, ...props }) => (
  <button
    aria-label="Go to next page"
    disabled={disabled}
    className={cn(
      "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
      "bg-white border border-gray-300 text-gray-700 rounded-md",
      "hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed",
      "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
      className
    )}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </button>
)
PaginationNext.displayName = "PaginationNext"

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
}
