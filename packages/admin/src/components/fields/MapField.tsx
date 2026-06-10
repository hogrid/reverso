import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { MapPin, Navigation, Search } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';

interface MapValue {
  lat: number;
  lng: number;
  address?: string;
  zoom?: number;
}

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 }; // New York City
const DEFAULT_ZOOM = 13;

/** Non-standard map attributes carried on the field marker. */
type MapFieldConfig = { center?: { lat?: number; lng?: number }; zoom?: number };

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export function MapField({ field, value, onChange, disabled }: FieldRendererProps) {
  const mapConfig = field as MapFieldConfig;
  const mapRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Parse current value
  const mapValue: MapValue = (value as MapValue) || {
    lat: mapConfig.center?.lat || DEFAULT_CENTER.lat,
    lng: mapConfig.center?.lng || DEFAULT_CENTER.lng,
    zoom: mapConfig.zoom || DEFAULT_ZOOM,
  };

  const handleCoordinateChange = useCallback(
    (key: 'lat' | 'lng', val: string) => {
      const num = Number.parseFloat(val);
      if (!isNaN(num)) {
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
    try {
      // Real geocoding via OpenStreetMap Nominatim (no API key required).
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
      }
      // No match (or request failed): keep the typed text as the address so
      // the editor can still fill coordinates manually.
      onChange({ ...mapValue, address: searchQuery });
    } catch {
      // Network/geocoder unavailable — fall back to the raw address text.
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
        console.error('Geolocation error:', error);
      }
    );
  }, [disabled, onChange]);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-8"
            disabled={disabled}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleSearch}
          disabled={disabled || isSearching || !searchQuery.trim()}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleGetCurrentLocation}
          disabled={disabled}
          title="Use current location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Map preview */}
      <Card>
        <CardContent className="p-0 relative overflow-hidden">
          <div
            ref={mapRef}
            className={cn(
              'h-[200px] bg-muted flex items-center justify-center',
              disabled && 'opacity-50'
            )}
          >
            {/* Placeholder map visualization */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/20 dark:to-green-900/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <MapPin className="h-8 w-8 text-red-500" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 rounded-full blur-sm" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              Map preview (interactive map requires API key)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coordinates input */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="0.0001"
            value={mapValue.lat}
            onChange={(e) => handleCoordinateChange('lat', e.target.value)}
            disabled={disabled}
            placeholder="-90 to 90"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="0.0001"
            value={mapValue.lng}
            onChange={(e) => handleCoordinateChange('lng', e.target.value)}
            disabled={disabled}
            placeholder="-180 to 180"
          />
        </div>
      </div>

      {/* Address input */}
      <div className="space-y-2">
        <Label htmlFor="address">Address (optional)</Label>
        <Input
          id="address"
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
