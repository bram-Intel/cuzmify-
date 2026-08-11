'use client';

import React from 'react';
import { ProductCard, ProductCardProps } from './ProductCard';
import { Search, Filter } from 'lucide-react';

const SAMPLE_PRODUCTS: ProductCardProps[] = [
  {
    id: 'prod_1',
    name: 'BeautyPro Studio Suite',
    category: 'Makeup & Hair',
    description: 'High-converting visual portfolio with instant WhatsApp booking, service menus, and Instagram feed integration.',
    priceCents: 0,
    developerName: 'Bram Intel Core',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
  },
  {
    id: 'prod_2',
    name: 'Vogue Boutique & Catalog',
    category: 'Fashion & Retail',
    description: 'Modular catalog for fashion sellers with attachable cart, automated size selection, and direct WhatsApp checkout.',
    priceCents: 2900,
    developerName: 'Cuzmify Devs',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
  },
  {
    id: 'prod_3',
    name: 'Couture Events & Planning',
    category: 'Event Planners',
    description: 'Elegant dark-gold theme with interactive event package calculator, client testimonials, and deposit payment gateway.',
    priceCents: 4900,
    developerName: 'Apex Templates',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    isFeatured: false,
  },
  {
    id: 'prod_4',
    name: 'Luxe Lens Photography',
    category: 'Photographers',
    description: 'Full-bleed gallery grid with high-speed asset loading, client portal proofing, and session reservation engine.',
    priceCents: 3500,
    developerName: 'Visionary Lab',
    imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&auto=format&fit=crop&q=80',
    isFeatured: false,
  },
];

export const MarketplaceGrid: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('ALL');

  const filteredProducts = SAMPLE_PRODUCTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category.includes(selectedCategory);
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#131A29] p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search digital products..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {['ALL', 'Makeup & Hair', 'Fashion & Retail', 'Event Planners', 'Photographers'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </div>
  );
};
