import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { FormControl } from "@/components/ui/form";
import { MapPin } from "lucide-react";

interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Enter address...",
  className = "",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Real Google Places API implementation
  const fetchSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          input,
          types: 'address',
          componentRestrictions: { country: 'uk' }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch address suggestions');
      }

      const data = await response.json();
      setSuggestions(data.predictions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce API calls
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    onChange(suggestion.structured_formatting.main_text);
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (onAddressSelect) {
      try {
        // Get detailed place information
        const response = await fetch('/api/places/details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ place_id: suggestion.place_id }),
        });

        if (response.ok) {
          const placeDetails = await response.json();
          const components = placeDetails.result?.address_components || [];
          
          // Parse address components
          let streetNumber = '';
          let route = '';
          let city = '';
          let postcode = '';
          
          components.forEach((component: any) => {
            const types = component.types;
            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            } else if (types.includes('route')) {
              route = component.long_name;
            } else if (types.includes('locality') || types.includes('postal_town')) {
              city = component.long_name;
            } else if (types.includes('postal_code')) {
              postcode = component.long_name;
            }
          });

          onAddressSelect({
            line1: `${streetNumber} ${route}`.trim() || suggestion.structured_formatting.main_text,
            city: city,
            postcode: postcode,
          });
        } else {
          // Fallback to parsing description
          const parts = suggestion.description.split(', ');
          // Improved UK postcode regex to handle all formats: A9 9AA, A99 9AA, AA9 9AA, AA99 9AA, A9A 9AA, AA9A 9AA
          const postcodeRegex = /([A-Z]{1,2}[0-9][A-Z0-9]?) ?([0-9][A-Z]{2})/i;
          const postcodeMatch = parts[parts.length - 1]?.match(postcodeRegex);
          const postcode = postcodeMatch ? `${postcodeMatch[1]} ${postcodeMatch[2]}`.toUpperCase() : "";
          
          onAddressSelect({
            line1: parts[0] || "",
            city: parts[1] || "",
            postcode: postcode,
          });
        }
      } catch (error) {
        console.error("Error getting place details:", error);
        // Fallback to parsing description
        const parts = suggestion.description.split(', ');
        // Improved UK postcode regex to handle all formats: A9 9AA, A99 9AA, AA9 9AA, AA99 9AA, A9A 9AA, AA9A 9AA
        const postcodeRegex = /([A-Z]{1,2}[0-9][A-Z0-9]?) ?([0-9][A-Z]{2})/i;
        const postcodeMatch = parts[parts.length - 1]?.match(postcodeRegex);
        const postcode = postcodeMatch ? `${postcodeMatch[1]} ${postcodeMatch[2]}`.toUpperCase() : "";
        
        onAddressSelect({
          line1: parts[0] || "",
          city: parts[1] || "",
          postcode: postcode,
        });
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      <FormControl>
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className={className}
            onFocus={() => value.length >= 3 && setShowSuggestions(true)}
          />
          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </FormControl>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-gray-500">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {isLoading && (
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}