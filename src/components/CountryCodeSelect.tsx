import Select, { SingleValue, StylesConfig } from 'react-select';
import ReactCountryFlag from 'react-country-flag';
import { COUNTRY_CODES } from '../lib/constants';

interface CountryOption {
  value: string; // Country code like 'IN', 'US'
  label: React.ReactElement;
  dialCode: string;
  digitCount: number;
}

interface CountryCodeSelectProps {
  value: string; // Current country code
  onChange: (countryCode: string) => void;
  className?: string;
}

export default function CountryCodeSelect({ value, onChange, className = '' }: CountryCodeSelectProps) {
  // Create options from COUNTRY_CODES
  const countryOptions: CountryOption[] = COUNTRY_CODES.map(country => ({
    value: country.code,
    dialCode: country.dialCode,
    digitCount: country.digitCount,
    label: (
      <div className="flex items-center gap-2">
        <ReactCountryFlag 
          countryCode={country.code} 
          svg 
          style={{
            width: '1.2em',
            height: '1.2em',
          }}
        />
        <span className="font-medium">{country.code}</span>
        <span className="text-gray-600">{country.dialCode}</span>
      </div>
    ),
  }));

  // Find current selected option
  const selectedOption = countryOptions.find(opt => opt.value === value) || countryOptions[0];

  // Custom styles for react-select
  const customStyles: StylesConfig<CountryOption, false> = {
    control: (provided) => ({
      ...provided,
      minHeight: '56px',
      borderRadius: '16px',
      borderColor: '#e5e7eb',
      minWidth: '180px',
      cursor: 'pointer',
      '&:hover': {
        borderColor: '#f43f5e',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      cursor: 'pointer',
      backgroundColor: state.isSelected 
        ? '#f43f5e' 
        : state.isFocused 
        ? '#ffe4e6' 
        : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      padding: '12px 16px',
      '&:active': {
        backgroundColor: '#f43f5e',
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    }),
  };

  const handleChange = (newValue: SingleValue<CountryOption>) => {
    if (newValue) {
      onChange(newValue.value);
    }
  };

  return (
    <Select<CountryOption>
      options={countryOptions}
      value={selectedOption}
      onChange={handleChange}
      styles={customStyles}
      className={className}
      isSearchable={true}
      placeholder="Select country"
    />
  );
}
