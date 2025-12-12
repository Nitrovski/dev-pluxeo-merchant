import { Link, NavLink } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { useCustomer } from "@/hooks/useCustomer"; // ?? PRIDÁNO

export function AppShell({ children }: { children: React.ReactNode }) {
  // ?? BOOTSTRAP CUSTOMER
  const customerId = useCustomer();

  // (volitelné – pro debug mužeš odkomentovat)
  // console.log("[AppShell] customerId:", customerId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">

          {/* Logo / Brand */}
          <Link to="/dashboard" className="text-lg font-semibold">
            Pluxeo Merchant
          </Link>

          {/* Navigation */}
          <nav className="flex gap-3 text-sm">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? "text-slate-50" : "text-slate-400 hover:text-slate-100"
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/cards"
              className={({ isActive }) =>
                isActive ? "text-slate-50" : "text-slate-400 hover:text-slate-100"
              }
            >
              Moje karty
            </NavLink>

            <NavLink
              to="/card-template"
              className={({ isActive }) =>
                isActive ? "text-slate-50" : "text-slate-400 hover:text-slate-100"
              }
            >
              Šablona karty
            </NavLink>
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <SignedIn>
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </SignedIn>

            <SignedOut>
              <Button variant="outline" size="sm">
                <Link to="/sign-in">Login</Link>
              </Button>
            </SignedOut>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
