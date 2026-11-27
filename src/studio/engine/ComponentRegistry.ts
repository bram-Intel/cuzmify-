/**
 * ComponentRegistry — registers all Cuzmify semantic component types with GrapesJS.
 * Each type maps to a meaningful business component (Hero, Services, Gallery, etc.)
 */
import type { Editor } from 'grapesjs';

export class ComponentRegistry {
  static register(editor: Editor): void {
    ComponentRegistry.registerDefaultDropRules(editor);
    ComponentRegistry.registerSmartVideo(editor);
    ComponentRegistry.registerHero(editor);
    ComponentRegistry.registerServiceList(editor);
    ComponentRegistry.registerGallery(editor);
    ComponentRegistry.registerWhatsAppCTA(editor);
    ComponentRegistry.registerBooking(editor);
    ComponentRegistry.registerTestimonials(editor);
    ComponentRegistry.registerNavbar(editor);
  }

  /**
   * Overrides GrapesJS's built-in ComponentVideo for HTML5 `<video>` tags, which otherwise
   * wraps `<video>` in an extra `<div>`, adds `gjs-no-pointer`, and treats empty boolean attrs
   * (`autoplay=""`, `muted=""`) as `false` so desktop canvas videos fail to autoplay.
   */
  private static registerSmartVideo(editor: Editor): void {
    const dc = editor.DomComponents;
    dc.addType('cuzmify-video', {
      isComponent: (el: HTMLElement) => el.tagName === 'VIDEO',
      model: {
        defaults: {
          name: 'Video',
          tagName: 'video',
          void: false,
          droppable: false,
          resizable: true,
          traits: [
            { type: 'text', name: 'src', label: 'Video URL' },
            { type: 'text', name: 'poster', label: 'Poster URL' },
            { type: 'checkbox', name: 'controls', label: 'Controls', valueTrue: 'true', valueFalse: '' },
            { type: 'checkbox', name: 'muted', label: 'Muted', valueTrue: 'true', valueFalse: '' },
            { type: 'checkbox', name: 'loop', label: 'Loop', valueTrue: 'true', valueFalse: '' },
            { type: 'checkbox', name: 'autoplay', label: 'Autoplay', valueTrue: 'true', valueFalse: '' },
          ],
        },
        init() {
          this.on('change:attributes', () => {
            (this as any).view?.syncVideoEl?.();
          });
        },
      },
      view: {
        syncVideoEl() {
          const el = (this as any).el as HTMLVideoElement | null;
          const model = (this as any).model;
          if (!el || el.tagName !== 'VIDEO' || !model) return;
          const attrs = model.getAttributes?.() || {};
          const shouldAutoplay = attrs.autoplay !== 'false';
          const shouldMute = attrs.muted !== 'false';
          const shouldLoop = attrs.loop !== 'false';
          const showControls = attrs.controls !== undefined && attrs.controls !== 'false' && attrs.controls !== false;

          el.muted = shouldMute;
          el.defaultMuted = shouldMute;
          el.playsInline = true;
          el.loop = shouldLoop;
          el.autoplay = shouldAutoplay;
          el.controls = Boolean(showControls);
          if (attrs.poster) el.poster = attrs.poster;

          if (attrs.src && el.getAttribute('src') !== attrs.src) {
            el.setAttribute('src', attrs.src);
            el.load();
          }
          if (shouldAutoplay && el.paused) {
            void el.play().catch(() => {});
          }
        },
        onRender() {
          (this as any).syncVideoEl();
          const el = (this as any).el as HTMLVideoElement | null;
          if (el && el.tagName === 'VIDEO') {
            el.addEventListener('canplay', () => {
              const attrs = (this as any).model?.getAttributes?.() || {};
              if (attrs.autoplay !== 'false' && el.paused) {
                el.muted = attrs.muted !== 'false';
                void el.play().catch(() => {});
              }
            });
          }
        },
      },
    });
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
