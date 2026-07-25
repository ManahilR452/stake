import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center space-y-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-500">
          <AlertCircle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter">404</h1>
          <p className="text-lg text-muted-foreground">
            Page not found
          </p>
        </div>
        <Link href="/">
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
            Return Home
          </div>
        </Link>
      </div>
    </div>
  );
}
