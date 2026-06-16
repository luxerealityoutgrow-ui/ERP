// components/multi-select-field.tsx
import React from 'react';
import { SimpleMultiSelect } from '@/components/simple-multi-select';
import { useTranslation } from 'react-i18next';

interface FormField {
  name: string;
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface MultiSelectFieldProps {
  field: FormField;
  formData: Record<string, any>;
  handleChange: (name: string, value: any) => void;
}

export function MultiSelectField({ field, formData, handleChange }: MultiSelectFieldProps) {
  const { t } = useTranslation();
  // Ensure selected value is always an array of strings
  const selectedValues = Array.isArray(formData[field.name]) 
    ? formData[field.name] 
    : formData[field.name] 
      ? [formData[field.name].toString()] 
      : [];
  
  return (
    <SimpleMultiSelect
      options={field.options || []}
      selected={selectedValues}
      onChange={(selected: string[]) => handleChange(field.name, selected)}
      placeholder={field.placeholder || t('Select {{label}}', { label: field.label })}
    />
  );
}