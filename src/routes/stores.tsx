import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, MapPin, Navigation, Phone, Search, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";

import { stores, type Store } from "@/data/stores";
import storeHeaderImg from "@/assets/store.jpg";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stores")({
  component: StoresPage,
});

export function StoresPage() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const cities = useMemo(() => Array.from(new Set(stores.map((s) => s.city))), []);

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchCity = !selectedCity || store.city.toLowerCase() === selectedCity.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        store.name.toLowerCase().includes(q) ||
        store.city.toLowerCase().includes(q) ||
        store.address.toLowerCase().includes(q);
      return matchCity && matchQuery;
    });
  }, [selectedCity, searchQuery]);

  const handleDirections = (store: Store) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${store.name} ${store.address}`,
    )}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
    toast.info(`Opening Google Maps directions for ${store.name}`);
  };

  return (
    <div className="bg-background pb-24">
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-ink py-20 text-ink-foreground">
        <img
          src={storeHeaderImg}
          alt="HEMMLOCK Stores"
          className="absolute inset-0 h-full w-full object-cover opacity-35 object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
        
        <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <span className="eyebrow bg-primary px-3 py-1.5 text-primary-foreground font-bold tracking-[0.2em]">
            RETAIL LOCATOR
          </span>
          <h1 className="display-xl mt-4 text-4xl sm:text-7xl text-white">
            FIND A HEMMLOCK STORE
          </h1>
          <p className="mt-4 text-sm sm:text-base text-zinc-300 max-w-xl leading-relaxed">
            Experience our signature red-and-white retail environment across 8 major Indian metro hubs. Try our architectural fits and feel our heavyweight fabrics.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12">
        {/* Search & City Filters */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b pb-8">
          {/* Search Box */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store name, city or area..."
              className="h-11 w-full border border-border bg-background pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {/* City Selector Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCity(null)}
              className={cn(
                "px-3.5 py-2 text-xs font-bold uppercase tracking-wider border transition-colors",
                !selectedCity
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground",
              )}
            >
              All Cities ({stores.length})
            </button>
            {cities.map((city) => {
              const count = stores.filter((s) => s.city === city).length;
              const isSelected = selectedCity === city;
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCity(isSelected ? null : city)}
                  className={cn(
                    "px-3.5 py-2 text-xs font-bold uppercase tracking-wider border transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-foreground",
                  )}
                >
                  {city} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Stores Grid & Interactive Map Container */}
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          {/* Stores List */}
          <div className="lg:col-span-7 space-y-6">
            {filteredStores.length > 0 ? (
              filteredStores.map((store) => (
                <div
                  key={store.id}
                  className="group relative border border-border bg-surface p-6 sm:p-8 transition-all hover:border-primary hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      {store.flagship && (
                        <span className="eyebrow bg-primary px-2.5 py-1 text-primary-foreground font-bold mb-2 inline-block">
                          Flagship Store
                        </span>
                      )}
                      <h3 className="display-xl text-xl sm:text-2xl text-foreground">
                        {store.name}
                      </h3>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary mt-1">
                        {store.city}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDirections(store)}
                      className="inline-flex items-center gap-1.5 border border-primary px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      <Navigation className="h-3.5 w-3.5" /> Directions
                    </button>
                  </div>

                  <hr className="my-4 border-border" />

                  <div className="space-y-2.5 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground">{store.address}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <a href={`tel:${store.phone}`} className="hover:underline font-mono text-foreground">
                        {store.phone}
                      </a>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <span>{store.timings}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center border border-dashed border-border bg-surface p-6">
                <StoreIcon className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <h3 className="display-xl mt-4 text-xl">No Stores Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try clearing your search query or selecting "All Cities".
                </p>
                <button
                  onClick={() => {
                    setSelectedCity(null);
                    setSearchQuery("");
                  }}
                  className="mt-6 inline-flex items-center bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
                >
                  Reset Locator Filters
                </button>
              </div>
            )}
          </div>

          {/* Interactive Map Visual Placeholder */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 border border-border bg-ink p-6 text-white space-y-6">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div>
                  <span className="eyebrow text-primary">Map Coverage</span>
                  <h3 className="display-xl text-xl text-white">PAN-INDIA STORES</h3>
                </div>
                <MapPin className="h-6 w-6 text-primary" />
              </div>

              {/* Visual Map Representation */}
              <div className="relative aspect-[4/3] w-full border border-white/10 bg-zinc-900 overflow-hidden flex items-center justify-center p-6 text-center">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e01020_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="relative z-10 space-y-3">
                  <StoreIcon className="mx-auto h-12 w-12 text-primary animate-pulse" />
                  <p className="display-xl text-lg text-white">8 ACTIVE METRO HUB STORES</p>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Mumbai • Bengaluru • Delhi • Hyderabad • Kolkata • Chennai • Pune • Ahmedabad
                  </p>
                  <div className="pt-2">
                    <span className="inline-block bg-primary/20 text-primary border border-primary/40 px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
                      Expanding to 5 New Cities in 2026
                    </span>
                  </div>
                </div>
              </div>

              {/* Retail Support Box */}
              <div className="border border-white/15 bg-zinc-900/60 p-4 text-xs space-y-2">
                <p className="font-bold text-white uppercase tracking-wider">Store Visit Assistance</p>
                <p className="text-zinc-400">
                  Planning a group fitting or bridal party visit? Contact our store concierges directly via phone for reserved styling suites.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
