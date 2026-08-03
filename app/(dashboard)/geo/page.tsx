"use client";

import { useState } from "react";
import { MapPin, Search, Star, Navigation } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBar } from "@/components/shared/FilterBar";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useGeoSearch, useGeoPois } from "@/hooks/useGeo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GeoPlace } from "@/types";

export default function GeoPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("");
  const [lat, setLat] = useState("24.7136");
  const [lng, setLng] = useState("46.6753");
  const [radius] = useState("5000");

  const { data: searchResults, isLoading: searchLoading, error: searchError } = useGeoSearch(
    { q: debouncedQuery, lat: Number(lat), lng: Number(lng), radius: Number(radius) },
    debouncedQuery.length >= 2
  );

  const { data: pois, isLoading: poisLoading, error: poisError } = useGeoPois({
    lat: Number(lat),
    lng: Number(lng),
    radius: Number(radius),
    category: category || undefined,
  });

  const handleSearch = () => setDebouncedQuery(query);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geo Services"
        description="Search places and discover nearby points of interest"
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search places..."
          className="flex-1"
        />
        <Button onClick={handleSearch} className="rounded-xl">
          <Search className="size-4" />
          Search
        </Button>
      </div>

      <FilterBar>
        <Input
          type="number"
          step="any"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="Latitude"
          className="h-9 w-32 rounded-xl"
        />
        <Input
          type="number"
          step="any"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          placeholder="Longitude"
          className="h-9 w-32 rounded-xl"
        />
<<<<<<< HEAD
        <Select value={category || "all"} onValueChange={(value) => {
          if (value === null) {
            return;
          }

          setCategory(value === "all" ? "" : value);
        }}>
=======
        <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : (v ?? ""))}>
>>>>>>> ec93b98 (fix(dashboard): resolve 72 TS errors, clean lint, restore broken data hooks)
          <SelectTrigger className="h-9 w-35 rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="restaurant">Restaurant</SelectItem>
            <SelectItem value="hotel">Hotel</SelectItem>
            <SelectItem value="attraction">Attraction</SelectItem>
            <SelectItem value="mosque">Mosque</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <DashboardCard title="Search Results">
            {searchLoading ? (
              <PageLoader />
            ) : searchError ? (
              <ErrorState message="Failed to search places" />
            ) : !debouncedQuery ? (
              <EmptyState title="Start searching" description="Enter a location or place name" />
            ) : !searchResults?.length ? (
              <EmptyState title="No results" description="Try a different search term" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {searchResults.map((place) => (
                  <PoiCard key={place.id} place={place} />
                ))}
              </div>
            )}
          </DashboardCard>

          <DashboardCard title="Nearby Places">
            {poisLoading ? (
              <PageLoader />
            ) : poisError ? (
              <ErrorState message="Failed to load nearby places" />
            ) : !pois?.length ? (
              <EmptyState title="No nearby places" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {pois.map((place) => (
                  <PoiCard key={place.id} place={place} />
                ))}
              </div>
            )}
          </DashboardCard>
        </div>

        <MapPlaceholder lat={lat} lng={lng} />
      </div>
    </div>
  );
}

function PoiCard({ place }: { place: GeoPlace }) {
  return (
    <div className="group rounded-xl border border-border/50 p-4 transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <MapPin className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{place.name}</p>
          <p className="text-xs capitalize text-muted-foreground">{place.type}</p>
          {place.address && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{place.address}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {place.distance !== undefined && (
              <span className="flex items-center gap-1">
                <Navigation className="size-3" />
                {(place.distance / 1000).toFixed(1)} km
              </span>
            )}
            {place.rating !== undefined && (
              <span className="flex items-center gap-1">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                {place.rating}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MapPlaceholder({ lat, lng }: { lat: string; lng: string }) {
  return (
    <DashboardCard title="Map" className="h-fit">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand/5 to-brand/20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(11,111,107,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(11,111,107,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative z-10 text-center">
          <MapPin className="mx-auto mb-2 size-8 text-brand" />
          <p className="text-sm font-medium">Map Preview</p>
          <p className="text-xs text-muted-foreground">
            {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}
