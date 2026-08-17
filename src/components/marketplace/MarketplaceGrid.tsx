'use client';

import React from 'react';
import { ProductCard, ProductCardProps } from './ProductCard';
import { Search } from 'lucide-react';

import { CATEGORY_BLUEPRINTS } from '@/core/blueprints';

const SAMPLE_PRODUCTS: ProductCardProps[] = Object.values(CATEGORY_BLUEPRINTS).map((bp) => ({
  id: bp.id,
  name: bp.name,
  category: bp.category,
  description: bp.description,
  priceCents: bp.priceCents,
  developerName: bp.developerName,
  imageUrl: bp.imageUrl,
  isFeatured: bp.isFeatured,
}));

export const MarketplaceGrid: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('ALL');
  const [activeTemplate, setActiveTemplate] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.selectedTemplate) {
          setActiveTemplate(data.user.selectedTemplate);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectTemplate = async (templateName: string) => {
    setActiveTemplate(templateName);
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedTemplate: templateName }),
      });
    } catch {
      // silent catch
    }
  };

  const CATEGORY_CHIPS = ['ALL', 'Makeup & Beauty', 'Fashion & Retail', 'Event Planners', 'Photographers', 'Jewelry & Accessories'];

  const filteredProducts = SAMPLE_PRODUCTS.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);

    let matchesCat = true;
    if (selectedCategory !== 'ALL') {
      const catLower = selectedCategory.toLowerCase();
      const pCatLower = p.category.toLowerCase();
      
      matchesCat =
        pCatLower.includes(catLower) ||
        (catLower.includes('makeup') && pCatLower.includes('makeup')) ||
        (catLower.includes('fashion') && pCatLower.includes('fashion')) ||
        (catLower.includes('event') && pCatLower.includes('event')) ||
        (catLower.includes('photo') && pCatLower.includes('photo')) ||
        (catLower.includes('jewelry') && pCatLower.includes('jewelry'));
    }

    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-5">
      {/* Compact Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#F7FAFC] p-3 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search digital products..."
            className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1A202C] placeholder-slate-400 focus:outline-none focus:border-[#0D5771]"
            suppressHydrationWarning
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {CATEGORY_CHIPS.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0D5771] text-white shadow-sm'
                  : 'bg-[#FFFFFF] text-[#64748B] border border-[#E2E8F0] hover:text-[#1A202C]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            activeTemplate={activeTemplate}
            onSelectTemplate={handleSelectTemplate}
          />
        ))}
      </div>
    </div>
  );
};
