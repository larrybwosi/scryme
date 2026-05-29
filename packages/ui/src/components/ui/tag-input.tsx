'use client';

import * as React from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { cn } from '@repo/ui/lib/utils';

interface TagInputProps {
  placeholder?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export function TagInput({ placeholder = 'Add tag...', tags, onChange, className }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('');

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onChange([...tags, trimmedValue]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2 p-2 rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2', className)}>
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            <span className="sr-only">Remove {tag}</span>
          </button>
        </Badge>
      ))}
      <div className="flex-1 flex items-center min-w-[120px]">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground focus:ring-0 p-0"
        />
      </div>
    </div>
  );
}
