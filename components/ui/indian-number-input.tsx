"use client";
import { useState } from 'react';
import { formatNumber } from '@/lib/formatters';

interface IndianNumberInputProps {
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  className?: string;
  required?: boolean;
  onValueChange?: (raw: string) => void;
}

// Displays digits grouped in the Indian numbering style (e.g. 5,00,00,000) as the
// user types, while submitting the plain numeric string via a hidden input so the
// server action still receives a clean number.
export function IndianNumberInput({
  name,
  defaultValue,
  placeholder,
  className,
  required,
  onValueChange,
}: IndianNumberInputProps) {
  const [raw, setRaw] = useState(defaultValue !== undefined && defaultValue !== null ? String(defaultValue) : '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/[^\d]/g, '');
    setRaw(digitsOnly);
    onValueChange?.(digitsOnly);
  };

  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        value={raw ? formatNumber(raw) : ''}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        required={required}
      />
      <input type="hidden" name={name} value={raw} />
    </>
  );
}
