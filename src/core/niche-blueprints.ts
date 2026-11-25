/**
 * CUZMIFY REUSABLE NICHE BLUEPRINT REGISTRY
 *
 * Defines domain language, section headings, enquiry form fields, and UI hints
 * for each service vendor niche WITHOUT inventing fake prices, fake ratings, or fake addresses.
 *
 * How to add a new niche:
 * Add an entry to `NICHE_BLUEPRINTS` below (~25 lines). All Template Engines and
 * the Onboarding/Editor UI pick it up automatically.
 */

export type NicheId =
  | 'beauty_makeup'
  | 'photography_media'
  | 'events_planning'
  | 'catering_cakes'
  | 'design_fashion'
  | 'general_services';

export interface NicheEnquiryField {
  name: 'eventDate' | 'location' | 'notes';
  label: string;
  placeholder: string;
  type: 'date' | 'text' | 'textarea';
  required?: boolean;
}

export interface NicheBlueprint {
  id: NicheId;
  label: string;
  shortLabel: string;
  subtitle: string;
  recommendedTemplate: 'editorial-atelier' | 'noir-showcase' | 'modern-studio';
  vocabulary: {
    portfolioEyebrow: string;
    portfolioHeading: string;
    servicesEyebrow: string;
    servicesHeading: string;
    aboutEyebrow: string;
    enquiryEyebrow: string;
    enquiryHeading: string;
    enquirySubheading: string;
    primaryCta: string;
    serviceItemCta: string;
    servicePlaceholderName: string;
    servicePlaceholderDesc: string;
  };
  enquiryFields: NicheEnquiryField[];
}

export const NICHE_BLUEPRINTS: Record<NicheId, NicheBlueprint> = {
  beauty_makeup: {
    id: 'beauty_makeup',
    label: 'Makeup, Hair & Beauty',
    shortLabel: 'Beauty & Glam',
    subtitle: 'Bridal makeup artists, hairstylists, salons, lash & nail studios',
    recommendedTemplate: 'editorial-atelier',
    vocabulary: {
      portfolioEyebrow: 'Portfolio',
      portfolioHeading: 'Selected Client Work',
      servicesEyebrow: 'Services & Rates',
      servicesHeading: 'Services & Packages',
      aboutEyebrow: 'About the Studio',
      enquiryEyebrow: 'Bookings',
      enquiryHeading: 'Check Availability & Book',
      enquirySubheading: 'Share your preferred date and service—we will confirm availability on WhatsApp.',
      primaryCta: 'Check Availability',
      serviceItemCta: 'Book This Service',
      servicePlaceholderName: 'e.g. Bridal Glam Package',
      servicePlaceholderDesc: 'e.g. Consultation, skin prep, full glam & touch-up kit',
    },
    enquiryFields: [
      { name: 'eventDate', label: 'Appointment / Event Date', placeholder: 'Select date', type: 'date', required: true },
      { name: 'location', label: 'Studio or Home Service Area', placeholder: 'e.g. Studio visit or Lekki Phase 1', type: 'text' },
      { name: 'notes', label: 'Additional Details', placeholder: 'Number of faces, preferred time, or special requests', type: 'textarea' },
    ],
  },

  photography_media: {
    id: 'photography_media',
    label: 'Photography & Videography',
    shortLabel: 'Photo & Video',
    subtitle: 'Portrait studios, wedding photographers, filmmakers & content creators',
    recommendedTemplate: 'noir-showcase',
    vocabulary: {
      portfolioEyebrow: 'Selected Works',
      portfolioHeading: 'Visual Portfolio',
      servicesEyebrow: 'Sessions & Rates',
      servicesHeading: 'Photography & Film Packages',
      aboutEyebrow: 'Behind the Lens',
      enquiryEyebrow: 'Session Enquiry',
      enquiryHeading: 'Book a Shoot',
      enquirySubheading: 'Tell us about your shoot date and concept to reserve your session.',
      primaryCta: 'Book a Shoot',
      serviceItemCta: 'Enquire on Package',
      servicePlaceholderName: 'e.g. Portrait Studio Session (2 Hours)',
      servicePlaceholderDesc: 'e.g. 2 outfit changes, studio lighting & 10 edited high-res photos',
    },
    enquiryFields: [
      { name: 'eventDate', label: 'Preferred Shoot Date', placeholder: 'Select date', type: 'date', required: true },
      { name: 'location', label: 'Shoot Location', placeholder: 'e.g. In-Studio or Outdoor Location', type: 'text' },
      { name: 'notes', label: 'Shoot Concept / Brief', placeholder: 'Occasion, number of outfits, or deliverables needed', type: 'textarea' },
    ],
  },

  events_planning: {
    id: 'events_planning',
    label: 'Event Planning & Decor',
    shortLabel: 'Events & Decor',
    subtitle: 'Wedding planners, luxury decorators, floral designers, MCs & DJs',
    recommendedTemplate: 'editorial-atelier',
    vocabulary: {
      portfolioEyebrow: 'Past Events',
      portfolioHeading: 'Event Productions & Styling',
      servicesEyebrow: 'Offerings',
      servicesHeading: 'Event Packages & Services',
      aboutEyebrow: 'Our Approach',
      enquiryEyebrow: 'Event Consultation',
      enquiryHeading: 'Request an Event Quote',
      enquirySubheading: 'Share your event date, venue city, and guest estimate for a tailored proposal.',
      primaryCta: 'Request a Quote',
      serviceItemCta: 'Request Proposal',
      servicePlaceholderName: 'e.g. Full Wedding Planning & Coordination',
      servicePlaceholderDesc: 'e.g. Vendor sourcing, floor plan design, budget & on-the-day coordination',
    },
    enquiryFields: [
      { name: 'eventDate', label: 'Event Date', placeholder: 'Select date', type: 'date', required: true },
      { name: 'location', label: 'Venue / City & Est. Guests', placeholder: 'e.g. Victoria Island, ~250 guests', type: 'text', required: true },
      { name: 'notes', label: 'Event Type & Vision', placeholder: 'Wedding, birthday, corporate event, color theme, etc.', type: 'textarea' },
    ],
  },

  catering_cakes: {
    id: 'catering_cakes',
    label: 'Catering, Cakes & Chefs',
    shortLabel: 'Catering & Cakes',
    subtitle: 'Event caterers, celebration cake bakers, private chefs & food trays',
    recommendedTemplate: 'modern-studio',
    vocabulary: {
      portfolioEyebrow: 'Kitchen & Creations',
      portfolioHeading: 'Recent Menus, Trays & Cakes',
      servicesEyebrow: 'Menus & Pricing',
      servicesHeading: 'Packages & Menu Options',
      aboutEyebrow: 'From Our Kitchen',
      enquiryEyebrow: 'Order & Catering Enquiry',
      enquiryHeading: 'Order or Request a Menu Quote',
      enquirySubheading: 'Tell us your delivery/event date and guest count to confirm your order.',
      primaryCta: 'Order / Get Quote',
      serviceItemCta: 'Order / Enquire',
      servicePlaceholderName: 'e.g. Celebration Cake or 50-Guest Buffet',
      servicePlaceholderDesc: 'e.g. Custom flavor selection, fresh preparation & setup',
    },
    enquiryFields: [
      { name: 'eventDate', label: 'Delivery / Event Date', placeholder: 'Select date', type: 'date', required: true },
      { name: 'location', label: 'Delivery Area & Guest/Serving Size', placeholder: 'e.g. Ikeja GRA • 30 guests', type: 'text', required: true },
      { name: 'notes', label: 'Menu / Cake Preferences', placeholder: 'Flavors, dietary notes, cake inscription, or custom menu items', type: 'textarea' },
    ],
  },

  design_fashion: {
    id: 'design_fashion',
    label: 'Fashion, Tailoring & Design',
    shortLabel: 'Fashion & Design',
    subtitle: 'Bespoke fashion designers, bridal couture, stylists & interior designers',
    recommendedTemplate: 'noir-showcase',
    vocabulary: {
      portfolioEyebrow: 'Lookbook & Projects',
      portfolioHeading: 'Featured Designs & Commissions',
      servicesEyebrow: 'Commissions & Services',
      servicesHeading: 'Bespoke Offerings',
      aboutEyebrow: 'The Label',
      enquiryEyebrow: 'Consultation',
      enquiryHeading: 'Book a Consultation',
      enquirySubheading: 'Share your timeline and design brief to schedule your consultation or fitting.',
      primaryCta: 'Book Consultation',
      serviceItemCta: 'Start Commission',
      servicePlaceholderName: 'e.g. Bespoke Bridal / Aso-Ebi Outfit',
      servicePlaceholderDesc: 'e.g. Sketch consultation, fabric guidance & custom fittings',
    },
    enquiryFields: [
      { name: 'eventDate', label: 'Target Delivery / Wearing Date', placeholder: 'Select date', type: 'date' },
      { name: 'location', label: 'City / Fitting Preference', placeholder: 'e.g. Abuja in-person or virtual measurement', type: 'text' },
      { name: 'notes', label: 'Design Brief', placeholder: 'Outfit/room style, occasion, or inspiration notes', type: 'textarea' },
    ],
  },

  general_services: {
    id: 'general_services',
    label: 'Creative & Professional Services',
    shortLabel: 'Other Services',
    subtitle: 'Music studios, fitness trainers, consultants, decorators & solo pros',
    recommendedTemplate: 'modern-studio',
    vocabulary: {
      portfolioEyebrow: 'Featured Work',
      portfolioHeading: 'Portfolio & Highlights',
      servicesEyebrow: 'Services',
      servicesHeading: 'Services & Rates',
      aboutEyebrow: 'About Us',
      enquiryEyebrow: 'Get in Touch',
      enquiryHeading: 'Send an Enquiry',
      enquirySubheading: 'Fill in your details below to connect with us directly on WhatsApp.',
      primaryCta: 'Make an Enquiry',
      serviceItemCta: 'Enquire Now',
      servicePlaceholderName: 'e.g. Signature Session',
      servicePlaceholderDesc: 'Describe what is included in this service',
    },
    enquiryFields: [
      { name: 'eventDate', label: 'Preferred Date', placeholder: 'Select date', type: 'date' },
      { name: 'location', label: 'Location / City', placeholder: 'Your city or preferred location', type: 'text' },
      { name: 'notes', label: 'How can we help?', placeholder: 'Share any details about what you need', type: 'textarea' },
    ],
  },
};

export const NICHE_LIST: NicheBlueprint[] = [
  NICHE_BLUEPRINTS.beauty_makeup,
  NICHE_BLUEPRINTS.photography_media,
  NICHE_BLUEPRINTS.events_planning,
  NICHE_BLUEPRINTS.catering_cakes,
  NICHE_BLUEPRINTS.design_fashion,
  NICHE_BLUEPRINTS.general_services,
];

/**
 * Resolves a NicheBlueprint from either an exact `NicheId` or a human category string.
 */
export function resolveNicheBlueprint(idOrCategory?: string | null): NicheBlueprint {
  if (!idOrCategory) return NICHE_BLUEPRINTS.beauty_makeup;
  if (idOrCategory in NICHE_BLUEPRINTS) {
    return NICHE_BLUEPRINTS[idOrCategory as NicheId];
  }

  const q = idOrCategory.toLowerCase();
  if (q.includes('photo') || q.includes('video') || q.includes('film') || q.includes('lens') || q.includes('media')) {
    return NICHE_BLUEPRINTS.photography_media;
  }
  if (q.includes('cater') || q.includes('cake') || q.includes('chef') || q.includes('food') || q.includes('bake')) {
    return NICHE_BLUEPRINTS.catering_cakes;
  }
  if (q.includes('event') || q.includes('decor') || q.includes('wedding') || q.includes('planner')) {
    return NICHE_BLUEPRINTS.events_planning;
  }
  if (q.includes('fashion') || q.includes('tailor') || q.includes('interior') || q.includes('design') || q.includes('styl')) {
    return NICHE_BLUEPRINTS.design_fashion;
  }
  if (q.includes('makeup') || q.includes('beauty') || q.includes('hair') || q.includes('salon') || q.includes('lash') || q.includes('nail')) {
    return NICHE_BLUEPRINTS.beauty_makeup;
  }

  return NICHE_BLUEPRINTS.general_services;
}
