import { describe, it, expect } from 'vitest';
import { AIEngine } from '@/studio/ai/AIEngine';

describe('AI Architecture & Intent Processing', () => {
  it('correctly detects Bridal niche from wedding prompts', () => {
    const plan = AIEngine.generateTransformation('Transform into a luxury bridal atelier with wedding trials');
    expect(plan.nicheDetected).toBe('Bridal & Destination Weddings');
    expect(plan.heroHeadline).toContain('Bridal');
    expect(plan.services?.length).toBeGreaterThan(0);
  });

  it('correctly detects Ultra-Luxury VIP Artistry from vip/gold prompts', () => {
    const plan = AIEngine.generateTransformation('Make it ultra luxury VIP red carpet style with gold accents');
    expect(plan.nicheDetected).toBe('Ultra-Luxury VIP Artistry');
    expect(plan.theme).toBe('luxury');
  });

  it('correctly detects Medical Aesthetics from medspa/clinical prompts', () => {
    const plan = AIEngine.generateTransformation('Change to a clinical medical spa and skin rejuvenation clinic');
    expect(plan.nicheDetected).toBe('Medical Aesthetic & Skin Clinic');
    expect(plan.theme).toBe('minimal');
  });

  it('rewrites inline text with the luxury tone action', () => {
    const res = AIEngine.rewriteInlineText('Book your makeup session today', 'tone_luxury');
    expect(res.transformed).toContain('Bespoke');
    expect(res.action).toBe('Luxury Tone');
  });

  it('generates punchy and high-converting WhatsApp hooks', () => {
    const res = AIEngine.rewriteInlineText('Bridal Package Trial', 'whatsapp_hook');
    expect(res.transformed).toContain('WhatsApp Booking');
    expect(res.transformed).toContain('Bridal Package Trial');
  });

  it('generates multiple creative variations on request', () => {
    const res = AIEngine.rewriteInlineText('Flawless 24-Hour HD Makeup', 'variations');
    expect(res.variations).toBeDefined();
    expect(res.variations?.length).toBe(3);
  });
});
