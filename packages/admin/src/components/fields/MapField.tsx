import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { MapValue } from '@reverso/core';
import { MapPin, Navigation, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 }; // New York
const DEFAULT_ZOOM = 13;

/** Non-standard map attributes carried on the field marker. */
type MapFieldConfig = { center?: { lat?: number; lng?: number }; zoom?: number };

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Accept the stored object, a legacy "lat,lng" string, or nothing.
 */
function parseMapValue(value: unknown, fallback: MapValue): MapValue {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Partial<MapValue>;
    if (typeof v.lat === 'number' && typeof v.lng === 'number') {
      return { ...fallback, ...v };
    }
  }
  if (typeof value === 'string') {
    const [lat, lng] = value.split(',').map((p) => Number.parseFloat(p.trim()));
    if (lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng)) {
      return { ...fallback, lat, lng };
    }
  }
  return fallback;
}

export function MapField({ field, value, onChange, disabled }: FieldRendererProps) {
  const mapConfig = field as MapFieldConfig;
  const fallback: MapValue = {
    lat: mapConfig.center?.lat ?? DEFAULT_CENTER.lat,
    lng: mapConfig.center?.lng ?? DEFAULT_CENTER.lng,
    zoom: mapConfig.zoom ?? DEFAULT_ZOOM,
  };
  const mapValue = parseMapValue(value, fallback);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);

  // Coordinates are edited as text so intermediate states ("-", "12.") can be
  // typed; the parent only receives finite numbers.
  const [latText, setLatText] = useState(String(mapValue.lat));
  const [lngText, setLngText] = useState(String(mapValue.lng));
  useEffect(() => {
    setLatText((current) => (Number.parseFloat(current) === mapValue.lat ? current : String(mapValue.lat)));
    setLngText((current) => (Number.parseFloat(current) === mapValue.lng ? current : String(mapValue.lng)));
  }, [mapValue.lat, mapValue.lng]);

  const commitCoordinate = useCallback(
    (key: 'lat' | 'lng', text: string) => {
      const num = Number.parseFloat(text);
      const max = key === 'lat' ? 90 : 180;
      if (Number.isFinite(num) && Math.abs(num) <= max) {
        onChange({ ...mapValue, [key]: num });
      }
    },
    [mapValue, onChange]
  );

  const handleAddressChange = useCallback(
    (address: string) => {
      onChange({ ...mapValue, address });
    },
    [mapValue, onChange]
  );

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || disabled) return;

    setIsSearching(true);
    setSearchNotice(null);
    try {
      // Geocoding via OpenStreetMap Nominatim (no API key required).
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('q', searchQuery);

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const results = (await response.json()) as NominatimResult[];
        const top = results[0];
        if (top) {
          onChange({
            lat: Number.parseFloat(top.lat),
            lng: Number.parseFloat(top.lon),
            address: top.display_name,
            zoom: mapValue.zoom,
          });
          setSearchQuery('');
          return;
        }
        setSearchNotice('No match for that address. Enter the coordinates below.');
      } else {
        setSearchNotice('Geocoding service unavailable. Enter the coordinates below.');
      }
      onChange({ ...mapValue, address: searchQuery });
    } catch {
      setSearchNotice('Geocoding service unreachable. Enter the coordinates below.');
      onChange({ ...mapValue, address: searchQuery });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, disabled, mapValue, onChange]);

  const handleGetCurrentLocation = useCallback(() => {
    if (disabled || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          zoom: 15,
          address: 'Current location',
        });
      },
      (error) => {
        setSearchNotice(`Could not read your location (${error.message}).`);
      }
    );
  }, [disabled, onChange]);

  const idFor = (suffix: string) => `${field.path}-${suffix}`;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a location..."
            aria-label="Search for a location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="pl-8"
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={disabled || isSearching || !searchQuery.trim()}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleGetCurrentLocation}
          disabled={disabled}
          title="Use current location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>
      {searchNotice && <p className="text-xs text-muted-foreground">{searchNotice}</p>}

      {/* Map preview: static OpenStreetMap link, no API key needed */}
      <Card>
        <CardContent className="p-0 relative overflow-hidden">
          <a
            href={`https://www.openstreetmap.org/?mlat=${mapValue.lat}&mlon=${mapValue.lng}#map=${mapValue.zoom ?? DEFAULT_ZOOM}/${mapValue.lat}/${mapValue.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'h-[160px] flex items-center justify-center relative',
              disabled && 'opacity-50 pointer-events-none'
            )}
            title="Open in OpenStreetMap"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/20 dark:to-green-900/20" />
            <MapPin className="relative h-8 w-8 text-red-500" />
            <span className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              Open in OpenStreetMap
            </span>
          </a>
        </CardContent>
      </Card>

      {/* Coordinates input */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={idFor('lat')}>Latitude</Label>
          <Input
            id={idFor('lat')}
            inputMode="decimal"
            value={latText}
            onChange={(e) => {
              setLatText(e.target.value);
              commitCoordinate('lat', e.target.value);
            }}
            disabled={disabled}
            placeholder="-90 to 90"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={idFor('lng')}>Longitude</Label>
          <Input
            id={idFor('lng')}
            inputMode="decimal"
            value={lngText}
            onChange={(e) => {
              setLngText(e.target.value);
              commitCoordinate('lng', e.target.value);
            }}
            disabled={disabled}
            placeholder="-180 to 180"
          />
        </div>
      </div>

      {/* Address input */}
      <div className="space-y-2">
        <Label htmlFor={idFor('address')}>Address (optional)</Label>
        <Input
          id={idFor('address')}
          value={mapValue.address || ''}
          onChange={(e) => handleAddressChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter a display address"
        />
      </div>

      {/* Current value display */}
      <div className="text-xs text-muted-foreground text-center">
        <MapPin className="h-3 w-3 inline mr-1" />
        {mapValue.lat.toFixed(6)}, {mapValue.lng.toFixed(6)}
        {mapValue.address && ` - ${mapValue.address}`}
      </div>
    </div>
  );
}
