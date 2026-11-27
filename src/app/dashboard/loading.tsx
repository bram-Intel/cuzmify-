import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A202C] pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8 animate-pulse">
        <div className="h-28 bg-[#F8FAFC] rounded-3xl border border-[#E2E8F0]" />
        <div className="h-44 bg-[#F8FAFC] rounded-3xl border border-[#E2E8F0]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-48 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]" />
          <div className="h-48 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]" />
          <div className="h-48 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]" />
        </div>
      </div>
    </div>
  );
}
