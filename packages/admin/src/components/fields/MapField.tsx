import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { MapPin, Navigation, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';

interface MapValue {
  lat: number;
  lng: number;
  address?: string;
  zoom?: number;
}

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 }; // New York City
const DEFAULT_ZOOM = 13;

export function MapField({ field, value, onChange, disabled }: FieldRendererProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Parse current value
  const mapValue: MapValue = (value as MapValue) || {
    lat: (field as any).center?.lat || DEFAULT_CENTER.lat,
    lng: (field as any).center?.lng || DEFAULT_CENTER.lng,
    zoom: (field as any).zoom || DEFAULT_ZOOM,
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
    // In production, this would call a geocoding API
    // For now, simulate a search delay and use mock coordinates
    setTimeout(() => {
      // Mock geocoding result
      const mockResults: Record<string, MapValue> = {
        'new york': { lat: 40.7128, lng: -74.006, address: 'New York, NY, USA' },
        london: { lat: 51.5074, lng: -0.1278, address: 'London, UK' },
        tokyo: { lat: 35.6762, lng: 139.6503, address: 'Tokyo, Japan' },
        paris: { lat: 48.8566, lng: 2.3522, address: 'Paris, France' },
        sydney: { lat: -33.8688, lng: 151.2093, address: 'Sydney, Australia' },
      };

      const searchLower = searchQuery.toLowerCase();
      const result = Object.entries(mockResults).find(([key]) => searchLower.includes(key));

      if (result) {
        onChange({ ...result[1], zoom: mapValue.zoom });
      } else {
        // Just update the address field
        onChange({ ...mapValue, address: searchQuery });
      }

      setIsSearching(false);
      setSearchQuery('');
    }, 500);
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

  // Generate static map URL for preview
  const mapImageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ef4444(${mapValue.lng},${mapValue.lat})/${mapValue.lng},${mapValue.lat},${mapValue.zoom || DEFAULT_ZOOM},0/400x200@2x?access_token=pk.placeholder`;

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
