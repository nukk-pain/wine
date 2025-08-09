/**
 * Simple dependency injection container for services
 */

export type ServiceFactory<T = any> = () => T;
export type ServiceInstance<T = any> = T;

export interface ServiceDefinition<T = any> {
  factory: ServiceFactory<T>;
  singleton?: boolean;
  instance?: ServiceInstance<T>;
}

export class ServiceContainer {
  private services = new Map<string, ServiceDefinition>();
  
  /**
   * Register a service factory
   */
  register<T>(
    name: string, 
    factory: ServiceFactory<T>, 
    options: { singleton?: boolean } = {}
  ): void {
    this.services.set(name, {
      factory,
      singleton: options.singleton ?? true
    });
  }
  
  /**
   * Register a service instance
   */
  registerInstance<T>(name: string, instance: T): void {
    this.services.set(name, {
      factory: () => instance,
      singleton: true,
      instance
    });
  }
  
  /**
   * Get a service instance
   */
  get<T>(name: string): T {
    const definition = this.services.get(name);
    
    if (!definition) {
      throw new Error(`Service '${name}' not found`);
    }
    
    if (definition.singleton) {
      if (!definition.instance) {
        definition.instance = definition.factory();
      }
      return definition.instance as T;
    }
    
    return definition.factory() as T;
  }
  
  /**
   * Check if service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }
  
  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
  }
  
  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
}

// Global service container instance
export const container = new ServiceContainer();

/**
 * Service decorator for automatic registration
 */
export function Service(name: string, options: { singleton?: boolean } = {}) {
  return function<T extends new (...args: any[]) => any>(constructor: T) {
    container.register(name, () => new constructor(), options);
    return constructor;
  };
}

/**
 * Injectable decorator to mark classes for dependency injection
 */
export function Injectable(target: any) {
  // This is a marker decorator
  return target;
}

/**
 * Inject dependencies into a function or class constructor
 */
export function inject<T extends (...args: any[]) => any>(
  dependencies: string[]
) {
  return function(target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (descriptor) {
      // Method decorator
      const originalMethod = descriptor.value;
      descriptor.value = function(...args: any[]) {
        const deps = dependencies.map(dep => container.get(dep));
        return originalMethod.apply(this, [...deps, ...args]);
      };
    } else {
      // Class decorator
      const originalConstructor = target;
      const newConstructor = function(...args: any[]) {
        const deps = dependencies.map(dep => container.get(dep));
        return new originalConstructor(...deps, ...args);
      };
      newConstructor.prototype = originalConstructor.prototype;
      return newConstructor as any;
    }
  };
}

/**
 * Initialize services with default implementations
 */
export function initializeServices() {
  // Register configuration service
  container.register('config', () => {
    return require('./config').getConfig();
  });
  
  // Register Gemini service
  container.register('geminiService', () => {
    return require('./gemini').geminiService;
  });
  
  // Register Vision service
  container.register('visionService', () => {
    // Return the vision functions as an object
    const vision = require('./vision');
    return {
      extractTextFromImage: vision.extractTextFromImage,
      processWineImage: vision.processWineImage
    };
  });
  
  // Register Notion service
  container.register('notionService', () => {
    const notion = require('./notion');
    return {
      saveWineToNotion: notion.saveWineToNotion,
      saveReceiptToNotion: notion.saveReceiptToNotion,
      saveWineToNotionV2: notion.saveWineToNotionV2,
      updateWineRecord: notion.updateWineRecord
    };
  });
}

/**
 * Utility function to create API handler with dependency injection
 */
export function createServiceHandler<T extends Record<string, any>>(
  dependencies: (keyof T)[],
  handler: (services: T, req: any, res: any) => Promise<void>
) {
  return async (req: any, res: any) => {
    const services = {} as T;
    
    for (const dep of dependencies) {
      services[dep] = container.get(dep as string);
    }
    
    return handler(services, req, res);
  };
}

/**
 * Mock service for testing
 */
export function mockService<T>(name: string, mockImplementation: T): () => void {
  const originalDefinition = container.has(name) ? container.get(name) : null;
  
  container.registerInstance(name, mockImplementation);
  
  // Return cleanup function
  return () => {
    if (originalDefinition) {
      container.registerInstance(name, originalDefinition);
    } else {
      (container as any).services.delete(name);
    }
  };
}