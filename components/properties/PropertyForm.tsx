"use client";
import { useFormState } from 'react-dom';
import { createPropertyAction } from '@/app/properties/actions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { TagsInput as TagPicker } from '@/components/ui/tags-input';
import { MediaPicker } from '@/components/ui/media-picker';

export function PropertyForm({ initialValues = {} }: { initialValues?: Partial<any> }) {
  const [state, formAction] = useFormState(createPropertyAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input name="title" defaultValue={initialValues.title ?? ''} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Property Code</label>
          <Input name="property_code" defaultValue={initialValues.property_code ?? ''} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <Input name="location" defaultValue={initialValues.location ?? ''} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <Textarea name="address" defaultValue={initialValues.address ?? ''} rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Property Type</label>
          <Select name="property_type" defaultValue={initialValues.property_type ?? ''}>
            <option value="">Select</option>
            <option value="Apartment">Apartment</option>
            <option value="Villa">Villa</option>
            <option value="Row House">Row House</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Configuration</label>
          <TagPicker name="configuration" defaultValue={initialValues.configuration ? initialValues.configuration.split(',') : []} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Carpet Area (sq ft)</label>
          <Input type="number" name="carpet_area" defaultValue={initialValues.carpet_area ?? ''} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Built-up Area (sq ft)</label>
          <Input type="number" name="built_up_area" defaultValue={initialValues.built_up_area ?? ''} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <Input type="number" name="price" defaultValue={initialValues.price ?? ''} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Listing Type</label>
          <Select name="listing_type" defaultValue={initialValues.listing_type ?? ''}> 
            <option value="">Select</option>
            <option value="Sale">Sale</option>
            <option value="Rent">Rent</option>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Owner Name</label>
        <Input name="owner_name" defaultValue={initialValues.owner_name ?? ''} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Owner Contact</label>
        <Input name="owner_contact" defaultValue={initialValues.owner_contact ?? ''} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea name="description" defaultValue={initialValues.description ?? ''} rows={3} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Images</label>
        <MediaPicker bucket="property-images" fieldPrefix="image_" />
      </div>

      <Button type="submit">Save Property</Button>
    </form>
  );
}
