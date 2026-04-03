import { Link } from 'react-router-dom'
import { HardHat, Home, Search, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-maroon-light rounded-full flex items-center justify-center mx-auto mb-6">
          <HardHat className="w-12 h-12 text-maroon" />
        </div>
        <h1
          className="text-maroon mb-3"
          style={{
            fontSize: "4rem",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <h2
          className="text-foreground mb-3"
          style={{ fontSize: "1.5rem", fontWeight: 600 }}
        >
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8">
          Looks like this page is still under construction! The
          page you're looking for doesn't exist or has been
          moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-dark text-white px-5 py-2.5 rounded-xl transition-colors"
            style={{ fontWeight: 600 }}
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link
            to="/search"
            className="flex items-center justify-center gap-2 border border-border text-foreground hover:bg-muted px-5 py-2.5 rounded-xl transition-colors"
            style={{ fontWeight: 500 }}
          >
            <Search className="w-4 h-4" /> Find Professionals
          </Link>
        </div>
      </div>
    </div>
  );
}