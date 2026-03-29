import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { countries } from "@/config/countries";

interface CountrySelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CountrySelect = ({ id, label, value, onChange, placeholder }: CountrySelectProps) => {
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.length > 0) {
      const filtered = countries.filter(country =>
        country.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCountries(filtered);
      setShowDropdown(true);
    } else {
      setFilteredCountries([]);
      setShowDropdown(false);
    }
  }, [value]);

  const handleSelect = (country: string) => {
    onChange(country);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <Label htmlFor={id}>{label}</Label>
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => value.length > 0 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />
      {showDropdown && filteredCountries.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {filteredCountries.slice(0, 10).map((country, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(country)}
            >
              {country}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
