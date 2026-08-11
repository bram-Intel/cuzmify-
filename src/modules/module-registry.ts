import { ModuleDefinition, CuzmifyModuleType } from '@/core/types';

export const CUZMIFY_MODULES: Record<CuzmifyModuleType, ModuleDefinition> = {
  CATALOG: {
    type: 'CATALOG',
    name: 'Product & Service Catalog',
    description: 'Display structured products, services, and price lists with rich media.',
    iconName: 'LayoutGrid',
    category: 'COMMERCE',
  },
  CART: {
    type: 'CART',
    name: 'Shopping Cart',
    description: 'Allow customers to select items and build orders.',
    iconName: 'ShoppingBag',
    requires: ['CATALOG'],
    category: 'COMMERCE',
  },
  ORDERS: {
    type: 'ORDERS',
    name: 'Order Management System',
    description: 'Track, fulfill, and manage incoming customer orders in real-time.',
    iconName: 'ClipboardList',
    requires: ['CART'],
    category: 'OPERATIONS',
  },
  PAYMENTS: {
    type: 'PAYMENTS',
    name: 'Online Payments',
    description: 'Accept credit cards, mobile bank transfers, and automated checkout.',
    iconName: 'CreditCard',
    requires: ['ORDERS'],
    category: 'COMMERCE',
  },
  DELIVERY: {
    type: 'DELIVERY',
    name: 'Logistics & Delivery Engine',
    description: 'Connect local dispatch riders, shipping fee calculators, and order tracking.',
    iconName: 'Truck',
    requires: ['ORDERS'],
    category: 'OPERATIONS',
  },
  BOOKING: {
    type: 'BOOKING',
    name: 'Appointment & Booking Engine',
    description: 'Allow clients to book slots, calendar sync, and deposit payments.',
    iconName: 'Calendar',
    category: 'ENGAGEMENT',
  },
  CRM: {
    type: 'CRM',
    name: 'Customer Relationship Manager',
    description: 'Maintain customer history, WhatsApp contact tags, and automated retention.',
    iconName: 'Users',
    category: 'ENGAGEMENT',
  },
  ANALYTICS: {
    type: 'ANALYTICS',
    name: 'Business Intelligence & Insights',
    description: 'Real-time visitor conversion metrics, popular items, and revenue tracking.',
    iconName: 'BarChart3',
    category: 'OPERATIONS',
  },
};

export class ModuleManager {
  /**
   * Validates if a module can be attached given the project's current active modules.
   */
  static canAttachModule(
    targetModule: CuzmifyModuleType,
    activeModules: CuzmifyModuleType[]
  ): { allowed: boolean; missingDependency?: CuzmifyModuleType } {
    const def = CUZMIFY_MODULES[targetModule];
    if (!def.requires || def.requires.length === 0) {
      return { allowed: true };
    }

    for (const req of def.requires) {
      if (!activeModules.includes(req)) {
        return { allowed: false, missingDependency: req };
      }
    }

    return { allowed: true };
  }
}
