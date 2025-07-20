export interface SequentialIdConfig {
  prefix: string;
  startNumber: number;
  padding: number;
  includeYear?: boolean;
}

export class SequentialIdManager {
  private counters: Map<string, number> = new Map();
  private configs: Map<string, SequentialIdConfig> = new Map();
  private invoiceNumberCounter: number = 0;

  constructor() {
    // Initialize configurations for each entity type
    this.configs.set('project', { prefix: 'PROJ', startNumber: 1, padding: 6, includeYear: true });
    this.configs.set('task', { prefix: 'TASK', startNumber: 1, padding: 6, includeYear: false });
    this.configs.set('timeEntry', { prefix: 'TIME', startNumber: 1, padding: 6, includeYear: false });
    this.configs.set('activity', { prefix: 'ACT', startNumber: 1, padding: 6, includeYear: false });
    this.configs.set('client', { prefix: 'CLIENT', startNumber: 1, padding: 6, includeYear: true });
    this.configs.set('invoice', { prefix: 'INV', startNumber: 1, padding: 6, includeYear: true });
    this.configs.set('expense', { prefix: 'EXP', startNumber: 1, padding: 6, includeYear: false });
    this.configs.set('payment', { prefix: 'PAY', startNumber: 1, padding: 6, includeYear: false });
  }

  /**
   * Initialize counters from existing data
   */
  async initializeCounters(getCounts: () => Promise<{ [key: string]: number }>): Promise<void> {
    try {
      const counts = await getCounts();
      
      for (const [entityType, count] of Object.entries(counts)) {
        this.counters.set(entityType, count);
      }
      
      // Initialize invoice number counter
      this.invoiceNumberCounter = counts.invoice || 0;
      
      console.log('SequentialIdManager: Initialized counters:', counts);
    } catch (error) {
      console.error('SequentialIdManager: Error initializing counters:', error);
      // Set default values if initialization fails
      for (const entityType of Array.from(this.configs.keys())) {
        this.counters.set(entityType, 0);
      }
      this.invoiceNumberCounter = 0;
    }
  }

  /**
   * Generate the next sequential ID for a given entity type
   */
  generateId(entityType: string): string {
    const config = this.configs.get(entityType);
    if (!config) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const currentCount = this.counters.get(entityType) || 0;
    const nextNumber = currentCount + 1;
    
    // Update the counter
    this.counters.set(entityType, nextNumber);

    // Format the number with padding
    const paddedNumber = nextNumber.toString().padStart(config.padding, '0');
    
    // Build the ID
    let id = config.prefix;
    
    if (config.includeYear) {
      const year = new Date().getFullYear();
      id += `-${year}-${paddedNumber}`;
    } else {
      id += `-${paddedNumber}`;
    }

    return id;
  }

  /**
   * Generate the next sequential invoice number
   */
  generateInvoiceNumber(): string {
    this.invoiceNumberCounter++;
    const year = new Date().getFullYear();
    const paddedNumber = this.invoiceNumberCounter.toString().padStart(6, '0');
    return `INV-${year}-${paddedNumber}`;
  }

  /**
   * Get the current count for an entity type
   */
  getCurrentCount(entityType: string): number {
    return this.counters.get(entityType) || 0;
  }

  /**
   * Set the current count for an entity type (useful for manual adjustments)
   */
  setCurrentCount(entityType: string, count: number): void {
    this.counters.set(entityType, count);
  }

  /**
   * Get all current counters
   */
  getAllCounters(): { [key: string]: number } {
    const result: { [key: string]: number } = {};
    for (const [entityType, count] of Array.from(this.counters.entries())) {
      result[entityType] = count;
    }
    return result;
  }

  /**
   * Reset all counters to 0
   */
  resetCounters(): void {
    for (const entityType of Array.from(this.configs.keys())) {
      this.counters.set(entityType, 0);
    }
    this.invoiceNumberCounter = 0;
  }
} 