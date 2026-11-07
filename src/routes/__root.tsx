import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShopProvider } from "@/lib/shop-store";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="display-xl text-7xl text-white">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Archive Piece Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The DRIPCYCLEX capsule or page you are seeking does not exist or has been vaulted.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center border border-white/20 bg-white px-6 py-3 text-xs font-bold tracking-[0.18em] text-black uppercase transition-colors hover:bg-zinc-200"
          >
            Return to Base
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Interface Interrupted
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong loading this view. You can reload or return to the main drop.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200"
          >
            Retry
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center border border-white/20 bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DRIPCYCLEX — Redefined Dark Streetwear" },
      {
        name: "description",
        content:
          "DRIPCYCLEX is a dark luxury streetwear brand: heavyweight fabrics, considered architectural drops, distressed chrome aesthetics, and draconic identity.",
      },
      { name: "author", content: "DRIPCYCLEX" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", type: "image/jpeg", href: "/dripcyclex-logo.jpg" },
      { rel: "apple-touch-icon", href: "/dripcyclex-logo.jpg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased selection:bg-white selection:text-black">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ShopProvider>
        <SiteHeader />
        <main className="min-h-screen pb-16 lg:pb-0">
          <Outlet />
        </main>
        <SiteFooter />
        <Toaster theme="dark" />
      </ShopProvider>
    </QueryClientProvider>
  );
}
