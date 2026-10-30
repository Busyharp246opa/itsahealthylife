import { useEffect, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import type { ChangeEvent } from 'react';

export const productImageBucket = 'product-images';
export const productImageLimit = 5;
export const productImageMaxBytes = 5 * 1024 * 1024;
const imageExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function productImagePaths(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((path): path is string => typeof path === 'string') : [];
}

export function validateProductImages(files: File[], existing = 0): void {
  if (files.length + existing > productImageLimit) throw new Error(`Use up to ${productImageLimit} images per product.`);
  for (const file of files) {
    if (!imageExtensions[file.type]) throw new Error(`${file.name}: choose a JPG, PNG or WebP image.`);
    if (file.size > productImageMaxBytes) throw new Error(`${file.name}: images must be 5 MB or smaller.`);
    if (!file.size) throw new Error(`${file.name}: this image is empty.`);
  }
}

export function productImagePath(productId: string, file: File): string {
  return `${productId}/${crypto.randomUUID()}.${imageExtensions[file.type]}`;
}

type PickerProps = {
  files: File[];
  onChange: (files: File[]) => void;
};

export function ProductImagePicker({ files, onChange }: PickerProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);
  const select = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    onChange(selected);
  };
  return <div className="product-image-picker">
    <div><strong>Product images</strong><small>Optional · up to five JPG, PNG or WebP files, 5 MB each. The first image is the cover.</small></div>
    <label className="product-image-upload"><ImagePlus size={18}/><span>Choose images</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={select}/></label>
    {files.length > 0 && <div className="product-image-preview-list">{files.map((file, index) => <div className="product-image-preview" key={`${file.name}-${index}`}><img src={previews[index]} alt={`Selected image ${index + 1}: ${file.name}`}/><button type="button" aria-label={`Remove ${file.name}`} onClick={() => onChange(files.filter((_, item) => item !== index))}><X size={14}/></button>{index === 0 && <span>Cover</span>}</div>)}</div>}
  </div>;
}
