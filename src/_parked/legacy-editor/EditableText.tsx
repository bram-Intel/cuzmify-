'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  tagName?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  className = '',
  style = {},
  multiline = false,
  tagName = 'span',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (text.trim() !== value) {
      onChange(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    } else if (e.key === 'Escape') {
      setText(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <div className="relative inline-block w-full z-20">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-[#FFFFFF] border-2 border-emerald-500 rounded-xl p-3 text-[#1A202C] text-sm focus:outline-none shadow-xl font-sans"
            rows={3}
            suppressHydrationWarning
          />
          <button
            onClick={handleBlur}
            className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div className="relative inline-block z-20 min-w-[120px]">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-[#FFFFFF] border-2 border-emerald-500 rounded-lg px-2 py-1 text-[#1A202C] text-inherit font-inherit focus:outline-none shadow-xl"
          suppressHydrationWarning
        />
      </div>
    );
  }

  const Tag = tagName;

  return (
    <Tag
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`group relative cursor-pointer inline-block rounded transition-all duration-200 hover:ring-2 hover:ring-emerald-400/80 hover:ring-offset-2 hover:bg-emerald-400/10 px-1 py-0.5 ${className}`}
      style={style}
      title="Click to edit text directly"
      suppressHydrationWarning
    >
      {text || value}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 -right-3 p-1 rounded-full bg-emerald-500 text-white text-[9px] shadow-md pointer-events-none z-10 flex items-center gap-0.5">
        <Edit2 className="w-2.5 h-2.5" />
      </span>
    </Tag>
  );
};
