'use client';

import React, { useState } from 'react';
import { MessageCircle, Calendar, MapPin, Phone, CheckCircle2, Inbox } from 'lucide-react';
import { buildVendorReplyWhatsAppUrl } from '@/lib/enquiry-utils';

export interface EnquiryItem {
  id: string;
  siteId: string;
  clientName: string;
  clientPhone?: string | null;
  serviceName?: string | null;
  eventDate?: string | null;
  location?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string | Date;
  site?: { id: string; name: string; subdomain?: string | null };
}

export function EnquiryInboxSection({ initialEnquiries }: { initialEnquiries: EnquiryItem[] }) {
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>(initialEnquiries);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (enquiryId: string, status: string) => {
    setUpdatingId(enquiryId);
    setEnquiries((prev) => prev.map((e) => (e.id === enquiryId ? { ...e, status } : e)));
    try {
      await fetch('/api/enquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enquiryId, status }),
      });
    } catch {
      // optimistic UI fallback
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1A202C] font-display flex items-center gap-2">
            <Inbox className="w-4 h-4 text-[#0D5771]" />
            <span>Client Enquiries ({enquiries.length})</span>
          </h2>
          <p className="text-xs text-[#64748B]">
            Every booking request from your website is saved here so you never miss a client.
          </p>
        </div>
      </div>

      {enquiries.length === 0 ? (
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 text-center space-y-1.5">
          <p className="text-xs font-bold text-[#1A202C]">No client enquiries yet</p>
          <p className="text-[11px] text-[#64748B] max-w-md mx-auto">
            Share your published website link in your Instagram bio. When clients fill out your booking form, their details appear here and on your WhatsApp.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {enquiries.map((enq) => {
            const replyUrl = enq.clientPhone
              ? buildVendorReplyWhatsAppUrl(
                  enq.clientPhone,
                  enq.site?.name || 'our studio',
                  enq.clientName,
                  enq.serviceName,
                  enq.eventDate
                )
              : null;

            return (
              <div
                key={enq.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#1A202C]">{enq.clientName}</h3>
                      {enq.serviceName && (
                        <p className="text-xs font-semibold text-[#0D5771]">{enq.serviceName}</p>
                      )}
                    </div>
                    <select
                      value={enq.status}
                      disabled={updatingId === enq.id}
                      onChange={(e) => handleStatusChange(enq.id, e.target.value)}
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border cursor-pointer ${
                        enq.status === 'booked'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : enq.status === 'contacted'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <option value="new">● NEW</option>
                      <option value="contacted">CONTACTED</option>
                      <option value="booked">✓ BOOKED</option>
                      <option value="archived">ARCHIVED</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-3 text-[11px] text-[#64748B]">
                    {enq.eventDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#0D5771]" />
                        {enq.eventDate}
                      </span>
                    )}
                    {enq.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#0D5771]" />
                        {enq.location}
                      </span>
                    )}
                    {enq.clientPhone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-[#0D5771]" />
                        {enq.clientPhone}
                      </span>
                    )}
                  </div>

                  {enq.notes && (
                    <p className="text-xs text-[#475569] bg-[#F8FAFC] p-2.5 rounded-xl border border-[#F1F5F9]">
                      {enq.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] gap-2">
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    {new Date(enq.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    {enq.status === 'new' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(enq.id, 'booked')}
                        className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Mark Booked</span>
                      </button>
                    )}
                    {replyUrl && (
                      <a
                        href={replyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1fb858] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Reply on WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
