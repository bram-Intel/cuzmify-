/**
 * ComponentRegistry — registers all Cuzmify semantic component types with GrapesJS.
 * Each type maps to a meaningful business component (Hero, Services, Gallery, etc.)
 */
import type { Editor } from 'grapesjs';

export class ComponentRegistry {
  static register(editor: Editor): void {
    ComponentRegistry.registerDefaultDropRules(editor);
    ComponentRegistry.registerHero(editor);
    ComponentRegistry.registerServiceList(editor);
    ComponentRegistry.registerGallery(editor);
    ComponentRegistry.registerWhatsAppCTA(editor);
    ComponentRegistry.registerBooking(editor);
    ComponentRegistry.registerTestimonials(editor);
    ComponentRegistry.registerNavbar(editor);
  }

  private static registerDefaultDropRules(editor: Editor): void {
    const dc = editor.DomComponents;

    dc.addType('section', {
      isComponent: (el: HTMLElement) => el.tagName === 'SECTION',
      model: {
        defaults: {
          droppable: true,
          draggable: true,
        },
      },
    });

    const defaultType = dc.getType('default');
    if (defaultType) {
      dc.addType('default', {
        model: {
          defaults: {
            ...defaultType.model.prototype.defaults,
            droppable: true,
          },
        },
      });
    }

    const wrapperType = dc.getType('wrapper');
    if (wrapperType) {
      dc.addType('wrapper', {
        model: {
          defaults: {
            ...wrapperType.model.prototype.defaults,
            droppable: true,
          },
        },
      });
    }
  }

  private static registerHero(editor: Editor): void {
    editor.DomComponents.addType('cuzmify-hero', {
      isComponent: (el: HTMLElement) =>
        el.dataset?.cuzmifyType === 'hero',
      model: {
        defaults: {
          name: 'Hero Section',
          droppable: true,
          draggable: true,
          traits: [
            { type: 'text', name: 'data-headline', label: 'Headline' },
            { type: 'text', name: 'data-subheadline', label: 'Subtitle' },
            { type: 'text', name: 'data-cta-text', label: 'Button Text' },
            { type: 'text', name: 'data-image-url', label: 'Hero Image URL' },
          ],
        },
      },
    });
  }

  private static registerServiceList(editor: Editor): void {
    editor.DomComponents.addType('cuzmify-services', {
      isComponent: (el: HTMLElement) =>
        el.dataset?.cuzmifyType === 'services',
      model: {
        defaults: {
          name: 'Services Section',
          droppable: true,
          draggable: true,
          traits: [
            { type: 'text', name: 'data-section-title', label: 'Section Title' },
          ],
        },
      },
    });
  }

  private static registerGallery(editor: Editor): void {
    editor.DomComponents.addType('cuzmify-gallery', {
      isComponent: (el: HTMLElement) =>
        el.dataset?.cuzmifyType === 'gallery',
      model: {
        defaults: {
          name: 'Gallery Section',
          droppable: true,
          draggable: true,
          traits: [
            { type: 'text', name: 'data-section-title', label: 'Gallery Title' },
          ],
        },
      },
    });
  }

  private static registerWhatsAppCTA(editor: Editor): void {
    editor.DomComponents.addType('cuzmify-whatsapp', {
      isComponent: (el: HTMLElement) =>
        el.dataset?.cuzmifyType === 'whatsapp',
      model: {
        defaults: {
          name: 'WhatsApp CTA',
          droppable: true,
          draggable: true,
          traits: [
            { type: 'text', name: 'data-phone', label: 'WhatsApp Number' },
            { type: 'text', name: 'data-message', label: 'Pre-filled Message' },
          ],
        },
      },
    });
  }

  private static registerBooking(editor: Editor): void {
    editor.DomComponents.addType('cuzmify-booking', {
      isComponent: (el: HTMLElement) =>
        el.dataset?.cuzmifyType === 'booking',
      model: {
        defaults: {
          name: 'Booking Section',
          droppable: true,
          draggable: true,
          traits: [
            { type: 'text', name: 'data-title', label: 'Section Title' },
            { type: 'text', name: 'data-phone', label: 'WhatsApp Number' },
          ],
        },
      },
    });
  }

  private static registerTestimonials(editor: Editor): void {
    editor.DomComponents.addType('cuzmify-testimonials', {
      isComponent: (el: HTMLElement) =>
        el.dataset?.cuzmifyType === 'testimonials',
      model: {
        defaults: {
          name: 'Testimonials',
          droppable: true,
          draggable: true,
          traits: [
            { type: 'text', name: 'data-title', label: 'Section Title' },
          ],
        },
      },
    });
  }

  private static registerNavbar(editor: Editor): void {
    editor.DomComponents.addType('cuzmify-navbar', {
      isComponent: (el: HTMLElement) =>
        el.dataset?.cuzmifyType === 'navbar',
      model: {
        defaults: {
          name: 'Navigation Bar',
          droppable: false,
          draggable: true,
          traits: [
            { type: 'text', name: 'data-brand', label: 'Brand Name' },
          ],
        },
      },
    });
  }
}
