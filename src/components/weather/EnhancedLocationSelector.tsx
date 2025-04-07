
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from '@/hooks/useLocation';
import { countries } from '@/data/countries';
import { getCitiesByCountry } from '@/services/LocationService';
import { Loader2, MapPin, Save, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EnhancedLocationSelectorProps {
  onLocationChange?: (city: string, country: string) => void;
  initialCity?: string;
  initialCountry?: string;
}

const EnhancedLocationSelector = ({ 
  onLocationChange,
  initialCity,
  initialCountry
}: EnhancedLocationSelectorProps) => {
  const {
    country,
    city,
    isDetecting,
    isSavingPreference,
    hasChanges,
    usingSavedPreference,
    detectLocation,
    saveLocationPreference,
    clearLocation,
    handleCountryChange,
    handleCityChange
  } = useLocation();
  
  const isMobile = useIsMobile();
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState('');
  
  // Initial setup from props
  useEffect(() => {
    if (initialCountry && !country) {
      handleCountryChange(initialCountry);
    }
    if (initialCity && !city) {
      handleCityChange(initialCity);
    }
  }, [initialCountry, initialCity]);
  
  // Notify parent component when location changes
  useEffect(() => {
    if (onLocationChange) {
      onLocationChange(city, country);
    }
  }, [city, country, onLocationChange]);
  
  // Load available cities when country changes
  useEffect(() => {
    if (country) {
      const cities = getCitiesByCountry(country, citySearch);
      setAvailableCities(cities);
    } else {
      setAvailableCities([]);
    }
  }, [country, citySearch]);
  
  // Handle city search input change
  const handleCitySearchChange = (value: string) => {
    setCitySearch(value);
    
    if (country) {
      const filteredCities = getCitiesByCountry(country, value);
      setAvailableCities(filteredCities);
    }
  };
  
  return (
    <Card className="bg-slate-800/40 border-purple-500/20 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-purple-200 flex items-center justify-between">
          <span>Your Location</span>
          {usingSavedPreference && (
            <Badge variant="outline" className="bg-green-600/20 text-green-300 border-green-500/30">
              <Check className="h-3 w-3 mr-1" />
              Using saved preference
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm text-white/70">Country</Label>
              <Select 
                value={country} 
                onValueChange={handleCountryChange}
              >
                <SelectTrigger className="border-purple-500/30 bg-slate-800">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-purple-500/30 max-h-[300px]">
                  {countries.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm text-white/70">City</Label>
              <Combobox
                items={availableCities.map(city => ({ value: city, label: city }))}
                value={city}
                onChange={handleCityChange}
                onInputChange={handleCitySearchChange}
                placeholder="Select or search city"
                disabled={!country}
                className="border-purple-500/30 bg-slate-800"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                className="border-purple-500/30 hover:bg-purple-500/20 flex items-center"
                onClick={detectLocation}
                disabled={isDetecting}
              >
                {isDetecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                {isMobile ? "Detect" : "Detect My Location"}
              </Button>
              
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "default"}
                className="text-white/70 hover:text-white flex items-center"
                onClick={clearLocation}
                disabled={!country && !city}
              >
                <X className="h-4 w-4 mr-2" />
                {isMobile ? "Clear" : "Clear Selection"}
              </Button>
            </div>
            
            <Button
              variant="secondary"
              size={isMobile ? "sm" : "default"}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center"
              onClick={saveLocationPreference}
              disabled={isSavingPreference || !country || !hasChanges}
            >
              {isSavingPreference ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isMobile ? "Save" : "Save as Preference"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedLocationSelector;
