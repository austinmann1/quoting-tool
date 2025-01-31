import { salesforceService } from './salesforce';
import { authService } from './auth';

export interface PricingRule {
  productId: string;
  basePrice: number;
  effectiveDate: string;
  endDate?: string;
  currency?: string;
  region?: string;
  tier?: string;
}

export interface DiscountRule {
  id: string;
  name: string;
  type: 'VOLUME' | 'ACCOUNT_TYPE' | 'SPECIAL';
  threshold: number;
  discountPercentage: number;
  effectiveDate: string;
  endDate?: string;
  accountType?: 'STUDENT' | 'ENTERPRISE' | 'STARTUP' | 'INDIVIDUAL';
  applicableUnits?: string[];
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

export interface ProductTier {
  id: string;
  name: string;
  description?: string;
}

export interface Unit {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  category?: string;
  features?: string[];
  active: boolean;
  applicableDiscounts?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UnitSearchParams {
  query?: string;
  page?: number;
  pageSize?: number;
  category?: string;
  sortBy?: 'name' | 'price' | 'category' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UnitSearchResult {
  units: Unit[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEMO_PRICING_KEY = 'demo_pricing_rules';
const DEMO_DISCOUNTS_KEY = 'demo_discount_rules';
const DEMO_UNITS_KEY = 'demo_units';

class ConfigurationService {
  private isDemoMode: boolean = true; // Set demo mode to true by default
  private apiBaseUrl: string = process.env.REACT_APP_PRICING_API_URL || '';
  private apiKey: string = process.env.REACT_APP_PRICING_API_KEY || '';
  private demoUnits: Unit[] | null = null;
  private demoDiscountRules: DiscountRule[] | null = null;
  private salesforceDiscountRules: DiscountRule[] = [];

  constructor() {
    // Reset demo data to ensure we have the latest values
    this.resetDemoData();
    
    // Initialize demo data if none exists
    if (!localStorage.getItem(DEMO_PRICING_KEY)) {
      this.setDemoPricingRules([
        {
          productId: 'codeium-enterprise',
          basePrice: 1000,
          effectiveDate: new Date().toISOString(),
        },
        {
          productId: 'cascade',
          basePrice: 2000,
          effectiveDate: new Date().toISOString(),
        },
      ]);
    }

    if (!localStorage.getItem(DEMO_DISCOUNTS_KEY)) {
      this.setDemoDiscountRules([
        {
          id: 'student-discount',
          name: 'Student Discount',
          type: 'ACCOUNT_TYPE',
          threshold: 0,
          discountPercentage: 50,
          effectiveDate: new Date().toISOString(),
          accountType: 'STUDENT',
          applicableUnits: []
        },
        {
          id: 'startup-discount',
          name: 'Startup Discount',
          type: 'ACCOUNT_TYPE',
          threshold: 0,
          discountPercentage: 30,
          effectiveDate: new Date().toISOString(),
          accountType: 'STARTUP',
          applicableUnits: []
        },
        {
          id: 'volume-discount',
          name: 'Volume Discount',
          type: 'VOLUME',
          threshold: 100,
          discountPercentage: 10,
          effectiveDate: new Date().toISOString(),
          applicableUnits: []
        }
      ]);
    }

    if (!localStorage.getItem(DEMO_UNITS_KEY)) {
      this.setDemoUnits([
        {
          id: 'codeium-enterprise',
          name: 'Codeium Enterprise',
          description: '',
          basePrice: 1000,
          category: 'Enterprise',
          features: ['AI Code Completion', 'Team Collaboration', 'Advanced Code Generation'],
          active: true,
          applicableDiscounts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'cascade',
          name: 'Cascade',
          description: '',
          basePrice: 2000,
          category: 'Premium',
          features: ['AI Code Completion', 'Code Analysis'],
          active: true,
          applicableDiscounts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    }
  }

  setDemoMode(isDemo: boolean) {
    this.isDemoMode = isDemo;
  }

  private getDemoPricingRules(): PricingRule[] {
    const stored = localStorage.getItem(DEMO_PRICING_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (err) {
      console.error('Error parsing stored pricing rules:', err);
      return [];
    }
  }

  private setDemoPricingRules(rules: PricingRule[]) {
    localStorage.setItem(DEMO_PRICING_KEY, JSON.stringify(rules));
  }

  private getDemoDiscountRules(): DiscountRule[] {
    const rulesJson = localStorage.getItem(DEMO_DISCOUNTS_KEY);
    if (!rulesJson) {
      const initialRules = [{
        id: 'student-discount',
        name: 'Student Discount',
        type: 'ACCOUNT_TYPE',
        threshold: 0,
        discountPercentage: 50,
        effectiveDate: new Date().toISOString(),
        accountType: 'STUDENT',
        applicableUnits: []
      }];
      localStorage.setItem(DEMO_DISCOUNTS_KEY, JSON.stringify(initialRules));
      return initialRules;
    }
    return JSON.parse(rulesJson);
  }

  private setDemoDiscountRules(rules: DiscountRule[]) {
    // Ensure we're not storing duplicates and all fields are properly formatted
    const uniqueRules = rules.reduce((acc: DiscountRule[], rule) => {
      const existingIndex = acc.findIndex(r => r.id === rule.id);
      if (existingIndex === -1) {
        // Ensure all required fields are present and properly formatted
        const formattedRule = {
          ...rule,
          type: rule.type,
          threshold: rule.threshold || 0,
          discountPercentage: rule.discountPercentage || 0,
          effectiveDate: rule.effectiveDate || new Date().toISOString(),
          applicableUnits: rule.applicableUnits || []
        };
        acc.push(formattedRule);
      }
      return acc;
    }, []);
    
    localStorage.setItem(DEMO_DISCOUNTS_KEY, JSON.stringify(uniqueRules));
    this.demoDiscountRules = uniqueRules;
  }

  private getDemoUnits(): Unit[] {
    const unitsJson = localStorage.getItem(DEMO_UNITS_KEY);
    if (!unitsJson) {
      const initialUnits: Unit[] = [
        {
          id: 'codeium-enterprise',
          name: 'Codeium Enterprise',
          description: '',
          basePrice: 1000,
          category: 'Enterprise',
          features: ['AI Code Completion', 'Team Collaboration', 'Advanced Code Generation'],
          active: true,
          applicableDiscounts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'cascade',
          name: 'Cascade',
          description: '',
          basePrice: 2000,
          category: 'Premium',
          features: ['AI Code Completion', 'Code Analysis'],
          active: true,
          applicableDiscounts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(DEMO_UNITS_KEY, JSON.stringify(initialUnits));
      return initialUnits;
    }
    return JSON.parse(unitsJson);
  }

  private setDemoUnits(units: Unit[]) {
    this.demoUnits = units;
    localStorage.setItem(DEMO_UNITS_KEY, JSON.stringify(units));
  }

  private async fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.apiBaseUrl || !this.apiKey) {
      throw new Error('Pricing API not configured');
    }

    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchFromSalesforce<T>(objectName: string, query: string): Promise<T[]> {
    return salesforceService.query(objectName, query);
  }

  async getPricingRules(): Promise<PricingRule[]> {
    if (this.isDemoMode) {
      const rules = this.getDemoPricingRules();
      // Group by productId and get the latest rule for each product
      const latestRules = new Map<string, PricingRule>();
      rules.forEach(rule => {
        const existingRule = latestRules.get(rule.productId);
        if (!existingRule || new Date(rule.effectiveDate) > new Date(existingRule.effectiveDate)) {
          latestRules.set(rule.productId, rule);
        }
      });
      return Array.from(latestRules.values());
    }

    try {
      // Try external pricing API first
      if (this.apiBaseUrl) {
        const rules = await this.fetchFromApi<PricingRule[]>('/pricing-rules');
        // Group by productId and get the latest rule for each product
        const latestRules = new Map<string, PricingRule>();
        rules.forEach(rule => {
          const existingRule = latestRules.get(rule.productId);
          if (!existingRule || new Date(rule.effectiveDate) > new Date(existingRule.effectiveDate)) {
            latestRules.set(rule.productId, rule);
          }
        });
        return Array.from(latestRules.values());
      }

      // Fallback to Salesforce
      const rules = await this.fetchFromSalesforce<PricingRule>(
        'PricingRule__c',
        'SELECT Id, ProductId__c, BasePrice__c, EffectiveDate__c, EndDate__c, Currency__c, Region__c, Tier__c ' +
        'FROM PricingRule__c ' +
        'WHERE EndDate__c = NULL OR EndDate__c > TODAY ' +
        'ORDER BY EffectiveDate__c DESC'
      );

      // Group by productId and get the latest rule for each product
      const latestRules = new Map<string, PricingRule>();
      rules.forEach(rule => {
        const existingRule = latestRules.get(rule.productId);
        if (!existingRule || new Date(rule.effectiveDate) > new Date(existingRule.effectiveDate)) {
          latestRules.set(rule.productId, rule);
        }
      });
      return Array.from(latestRules.values());
    } catch (err) {
      console.error('Error fetching pricing rules:', err);
      throw err;
    }
  }

  async getDiscountRules(): Promise<DiscountRule[]> {
    if (this.isDemoMode) {
      return this.getDemoDiscountRules();
    }

    try {
      // Try external pricing API first
      if (this.apiBaseUrl) {
        return await this.fetchFromApi<DiscountRule[]>('/discount-rules');
      }
      
      const result = await salesforceService.query('DiscountRule__c');
      return result.map(record => ({
        id: record.Id,
        name: record.Name,
        type: record.Type__c,
        threshold: record.Threshold__c,
        discountPercentage: record.DiscountPercentage__c,
        effectiveDate: record.EffectiveDate__c,
        endDate: record.EndDate__c,
        region: record.Region__c,
        customerType: record.CustomerType__c,
        tier: record.Tier__c
      }));
    } catch (err) {
      console.error('Error fetching discount rules:', err);
      return [];
    }
  }

  async createDiscountRule(rule: Omit<DiscountRule, 'id'>): Promise<DiscountRule> {
    if (this.isDemoMode) {
      const newRule: DiscountRule = {
        ...rule,
        id: `discount${Math.random().toString(36).substring(7)}`,
        effectiveDate: new Date().toISOString(),
        type: rule.type.toUpperCase() as DiscountRule['type']
      };
      this.demoDiscountRules = this.getDemoDiscountRules();
      this.demoDiscountRules.push(newRule);
      this.setDemoDiscountRules(this.demoDiscountRules);
      return newRule;
    }

    try {
      // Try external pricing API first
      if (this.apiBaseUrl) {
        return await this.fetchFromApi<DiscountRule>('/discount-rules', {
          method: 'POST',
          body: JSON.stringify(rule)
        });
      }

      // Fallback to Salesforce
      const result = await salesforceService.create('DiscountRule__c', {
        Name: rule.name,
        Type__c: rule.type,
        Threshold__c: rule.threshold,
        DiscountPercentage__c: rule.discountPercentage,
        EffectiveDate__c: new Date().toISOString(),
        Region__c: rule.region,
        CustomerType__c: rule.customerType,
        Tier__c: rule.tier
      });

      return {
        id: result.Id,
        name: result.Name,
        type: result.Type__c,
        threshold: result.Threshold__c,
        discountPercentage: result.DiscountPercentage__c,
        effectiveDate: result.EffectiveDate__c,
        endDate: result.EndDate__c,
        region: result.Region__c,
        customerType: result.CustomerType__c,
        tier: result.Tier__c
      };
    } catch (err) {
      console.error('Error creating discount rule:', err);
      throw err;
    }
  }

  async updateDiscountRule(id: string, updates: Partial<DiscountRule>): Promise<DiscountRule> {
    if (this.isDemoMode) {
      const rules = this.getDemoDiscountRules();
      const index = rules.findIndex(r => r.id === id);
      
      if (index === -1) {
        throw new Error('Discount rule not found');
      }

      // Update the existing rule
      const updatedRule = {
        ...rules[index],
        ...updates,
        type: updates.type ? updates.type.toUpperCase() as DiscountRule['type'] : rules[index].type
      };

      // Replace the old rule with the updated one
      rules[index] = updatedRule;
      
      // Save changes
      this.setDemoDiscountRules(rules);

      return updatedRule;
    }

    try {
      if (this.apiBaseUrl) {
        return await this.fetchFromApi<DiscountRule>(`/discount-rules/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
      }

      // Fallback to Salesforce
      const result = await salesforceService.update('DiscountRule__c', id, {
        Name: updates.name,
        Type__c: updates.type,
        Threshold__c: updates.threshold,
        DiscountPercentage__c: updates.discountPercentage,
        Region__c: updates.region,
        CustomerType__c: updates.customerType,
        Tier__c: updates.tier
      });

      return {
        id: result.Id,
        name: result.Name,
        type: result.Type__c,
        threshold: result.Threshold__c,
        discountPercentage: result.DiscountPercentage__c,
        effectiveDate: result.EffectiveDate__c,
        endDate: result.EndDate__c,
        region: result.Region__c,
        customerType: result.CustomerType__c,
        tier: result.Tier__c
      };
    } catch (err) {
      console.error('Error updating discount rule:', err);
      throw err;
    }
  }

  async deleteDiscountRule(id: string): Promise<void> {
    if (this.isDemoMode) {
      const rules = this.getDemoDiscountRules();
      const filteredRules = rules.filter(r => r.id !== id);
      this.setDemoDiscountRules(filteredRules);
      return;
    }

    try {
      if (this.apiBaseUrl) {
        await this.fetchFromApi(`/discount-rules/${id}`, {
          method: 'DELETE'
        });
        return;
      }

      await salesforceService.delete('DiscountRule__c', id);
    } catch (err) {
      console.error('Error deleting discount rule:', err);
      throw err;
    }
  }

  async getUnits(params: UnitSearchParams): Promise<UnitSearchResult> {
    if (this.isDemoMode) {
      const allUnits = this.getDemoUnits();
      return this.filterAndPaginateUnits(allUnits, params);
    }

    try {
      if (this.apiBaseUrl) {
        const queryParams = new URLSearchParams();
        if (params.query) queryParams.set('q', params.query);
        if (params.page) queryParams.set('page', params.page.toString());
        if (params.pageSize) queryParams.set('pageSize', params.pageSize.toString());
        if (params.category) queryParams.set('category', params.category);
        if (params.sortBy) queryParams.set('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

        return await this.fetchFromApi<UnitSearchResult>(`/units?${queryParams.toString()}`);
      }

      // Fallback to Salesforce
      const whereClause = params.query 
        ? `WHERE Name LIKE '%${params.query}%' OR Description__c LIKE '%${params.query}%'`
        : '';
      const orderClause = params.sortBy 
        ? `ORDER BY ${this.getSalesforceFieldName(params.sortBy)} ${params.sortOrder || 'ASC'}`
        : 'ORDER BY Name ASC';
      const limitClause = params.pageSize 
        ? `LIMIT ${params.pageSize} OFFSET ${((params.page || 1) - 1) * params.pageSize}`
        : '';

      const units = await this.fetchFromSalesforce<Unit>(
        'Unit__c',
        `SELECT Id, Name, Description__c, BasePrice__c, Category__c, Features__c, 
         Active__c, CreatedDate, LastModifiedDate, ApplicableDiscounts__c
         FROM Unit__c ${whereClause} ${orderClause} ${limitClause}`
      );

      const totalResult = await this.fetchFromSalesforce<{ count: number }>(
        'Unit__c',
        `SELECT COUNT(Id) count FROM Unit__c ${whereClause}`
      );

      return {
        units,
        total: totalResult[0].count,
        page: params.page || 1,
        pageSize: params.pageSize || units.length,
        totalPages: Math.ceil(totalResult[0].count / (params.pageSize || units.length))
      };
    } catch (err) {
      console.error('Error fetching units:', err);
      throw err;
    }
  }

  async createUnit(unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Unit> {
    if (this.isDemoMode) {
      const newUnit: Unit = {
        ...unit,
        id: Math.random().toString(36).substring(7),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.demoUnits = this.getDemoUnits();
      this.demoUnits.push(newUnit);
      this.setDemoUnits(this.demoUnits);
      return newUnit;
    }

    try {
      if (this.apiBaseUrl) {
        return await this.fetchFromApi<Unit>('/units', {
          method: 'POST',
          body: JSON.stringify(unit)
        });
      }

      // Fallback to Salesforce
      const result = await salesforceService.create('Unit__c', {
        Name: unit.name,
        Description__c: unit.description,
        BasePrice__c: unit.basePrice,
        Category__c: unit.category,
        Features__c: unit.features?.join(';'),
        Active__c: unit.active,
        ApplicableDiscounts__c: unit.applicableDiscounts?.join(';')
      });

      return this.convertSalesforceUnit(result);
    } catch (err) {
      console.error('Error creating unit:', err);
      throw err;
    }
  }

  async updateUnit(id: string, updates: Partial<Unit>): Promise<Unit> {
    if (this.isDemoMode) {
      const units = this.getDemoUnits();
      const index = units.findIndex(u => u.id === id);
      
      // If this is a default unit (codeium-enterprise or cascade), only allow status updates
      const isDefaultUnit = ['codeium-enterprise', 'cascade'].includes(id);
      if (isDefaultUnit) {
        const updatedUnit = {
          ...units[index],
          active: updates.active ?? units[index].active,
          updatedAt: new Date().toISOString()
        };
        units[index] = updatedUnit;
        this.setDemoUnits(units);
        return updatedUnit;
      }
      
      // For non-default units, allow all updates
      const updatedUnit = {
        ...units[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      units[index] = updatedUnit;
      this.setDemoUnits(units);
      return updatedUnit;
    }

    try {
      if (this.apiBaseUrl) {
        return await this.fetchFromApi<Unit>(`/units/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates)
        });
      }

      // Fallback to Salesforce
      const result = await salesforceService.update('Unit__c', id, {
        Name: updates.name,
        Description__c: updates.description,
        BasePrice__c: updates.basePrice,
        Category__c: updates.category,
        Features__c: updates.features?.join(';'),
        Active__c: updates.active,
        ApplicableDiscounts__c: updates.applicableDiscounts?.join(';')
      });

      return this.convertSalesforceUnit(result);
    } catch (err) {
      console.error('Error updating unit:', err);
      throw err;
    }
  }

  async deleteUnit(id: string): Promise<void> {
    if (this.isDemoMode) {
      const units = this.getDemoUnits();
      const filteredUnits = units.filter(u => u.id !== id);
      this.setDemoUnits(filteredUnits);
      return;
    }

    try {
      if (this.apiBaseUrl) {
        await this.fetchFromApi(`/units/${id}`, {
          method: 'DELETE'
        });
        return;
      }

      await salesforceService.delete('Unit__c', id);
    } catch (err) {
      console.error('Error deleting unit:', err);
      throw err;
    }
  }

  async getApplicableDiscounts(units: number, unitId: string): Promise<DiscountRule[]> {
    const rules = await this.getDiscountRules();
    const now = new Date().toISOString();
    const currentUser = authService.getCurrentSession();
    const accountType = currentUser?.accountType || 'INDIVIDUAL';
    
    console.log('Debug - Checking discounts:', {
      currentUser,
      accountType,
      units,
      unitId,
      totalRules: rules.length
    });
    
    const applicableRules = rules
      .filter(r => {
        // Check if the rule is currently effective
        if (r.effectiveDate > now || (r.endDate && r.endDate <= now)) {
          console.log('Debug - Rule not effective:', r);
          return false;
        }

        // Check account-type based discounts
        if (r.type === 'ACCOUNT_TYPE') {
          const isApplicable = r.accountType === accountType;
          console.log('Debug - Account type check:', {
            ruleType: r.type,
            ruleAccountType: r.accountType,
            userAccountType: accountType,
            isApplicable
          });
          return isApplicable;
        }

        // Check volume-based discounts
        if (r.type === 'VOLUME' && units >= r.threshold) {
          console.log('Debug - Volume discount applies:', {
            ruleType: r.type,
            threshold: r.threshold,
            units
          });
          return true;
        }

        // Special discounts are always checked
        if (r.type === 'SPECIAL') {
          console.log('Debug - Special discount check:', r);
          return true;
        }

        console.log('Debug - Rule not applicable:', r);
        return false;
      })
      .sort((a, b) => {
        // Sort by discount percentage in descending order
        return b.discountPercentage - a.discountPercentage;
      });

    console.log('Debug - Final applicable rules:', applicableRules);
    return applicableRules;
  }

  async updatePricingRule(productId: string, newPrice: number): Promise<void> {
    if (this.isDemoMode) {
      const rules = this.getDemoPricingRules();
      const index = rules.findIndex(r => r.productId === productId);
      
      // End the current rule
      if (index !== -1) {
        rules[index].endDate = new Date().toISOString();
      }

      // Add new rule
      rules.push({
        productId,
        basePrice: newPrice,
        effectiveDate: new Date().toISOString(),
      });

      this.setDemoPricingRules(rules);
    } else {
      try {
        // Try external pricing API first
        if (this.apiBaseUrl) {
          await fetch(`${this.apiBaseUrl}/pricing-rules`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId,
              basePrice: newPrice,
              effectiveDate: new Date().toISOString(),
            }),
          });
          return;
        }

        // Fallback to Salesforce
        await salesforceService.createRecord('PricingRule__c', {
          ProductId__c: productId,
          BasePrice__c: newPrice,
          EffectiveDate__c: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error updating pricing rule:', err);
        throw err;
      }
    }
  }

  async updateDiscountRule(ruleId: string, updates: Partial<DiscountRule>): Promise<void> {
    if (this.isDemoMode) {
      const rules = this.getDemoDiscountRules();
      const index = rules.findIndex(r => r.id === ruleId);
      
      // End the current rule
      if (index !== -1) {
        rules[index].endDate = new Date().toISOString();
      }

      // Add new rule
      rules.push({
        ...rules[index],
        ...updates,
        id: ruleId,
        effectiveDate: new Date().toISOString()
      });

      this.setDemoDiscountRules(rules);
    } else {
      try {
        // Try external pricing API first
        if (this.apiBaseUrl) {
          await fetch(`${this.apiBaseUrl}/discount-rules/${ruleId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          });
          return;
        }

        // Fallback to Salesforce
        await salesforceService.updateRecord('DiscountRule__c', ruleId, {
          ...updates,
          EffectiveDate__c: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error updating discount rule:', err);
        throw err;
      }
    }
  }

  // Helper to get current active price for a product
  async getCurrentPrice(productId: string): Promise<number> {
    const rules = await this.getPricingRules();
    const now = new Date().toISOString();
    
    // Get the most recent active rule
    const activeRules = rules
      .filter(r => r.productId === productId)
      .filter(r => r.effectiveDate <= now && (!r.endDate || r.endDate > now))
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

    if (activeRules.length === 0) {
      throw new Error(`No active pricing rule found for product ${productId}`);
    }

    return activeRules[0].basePrice;
  }

  // Helper to get current active discount rules
  async getCurrentDiscounts(): Promise<DiscountRule[]> {
    const rules = await this.getDiscountRules();
    const now = new Date().toISOString();
    
    return rules
      .filter(r => r.effectiveDate <= now && (!r.endDate || r.endDate > now))
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  }

  resetDemoData() {
    localStorage.removeItem(DEMO_PRICING_KEY);
    localStorage.removeItem(DEMO_DISCOUNTS_KEY);
    localStorage.removeItem(DEMO_UNITS_KEY);
    
    // Reset the instance variables
    this.demoUnits = null;
    this.demoDiscountRules = null;
    
    // Re-initialize with default data
    if (!localStorage.getItem(DEMO_PRICING_KEY)) {
      this.setDemoPricingRules([
        {
          productId: 'codeium-enterprise',
          basePrice: 1000,
          effectiveDate: new Date().toISOString(),
        },
        {
          productId: 'cascade',
          basePrice: 2000,
          effectiveDate: new Date().toISOString(),
        },
      ]);
    }

    if (!localStorage.getItem(DEMO_DISCOUNTS_KEY)) {
      this.setDemoDiscountRules([
        {
          id: 'student-discount',
          name: 'Student Discount',
          type: 'ACCOUNT_TYPE',
          threshold: 0,
          discountPercentage: 50,
          effectiveDate: new Date().toISOString(),
          accountType: 'STUDENT',
          applicableUnits: []
        },
        {
          id: 'startup-discount',
          name: 'Startup Discount',
          type: 'ACCOUNT_TYPE',
          threshold: 0,
          discountPercentage: 30,
          effectiveDate: new Date().toISOString(),
          accountType: 'STARTUP',
          applicableUnits: []
        },
        {
          id: 'volume-discount',
          name: 'Volume Discount',
          type: 'VOLUME',
          threshold: 100,
          discountPercentage: 10,
          effectiveDate: new Date().toISOString(),
          applicableUnits: []
        }
      ]);
    }

    if (!localStorage.getItem(DEMO_UNITS_KEY)) {
      this.setDemoUnits([
        {
          id: 'codeium-enterprise',
          name: 'Codeium Enterprise',
          description: '',
          basePrice: 1000,
          category: 'Enterprise',
          features: ['AI Code Completion', 'Team Collaboration', 'Advanced Code Generation'],
          active: true,
          applicableDiscounts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'cascade',
          name: 'Cascade',
          description: '',
          basePrice: 2000,
          category: 'Premium',
          features: ['AI Code Completion', 'Code Analysis'],
          active: true,
          applicableDiscounts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    }
  }

  private filterAndPaginateUnits(units: Unit[], params: UnitSearchParams): UnitSearchResult {
    let filteredUnits = [...units];

    // Apply search filter
    if (params.query) {
      const query = params.query.toLowerCase();
      filteredUnits = filteredUnits.filter(unit => 
        unit.name.toLowerCase().includes(query) ||
        unit.description?.toLowerCase().includes(query) ||
        unit.category?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (params.category) {
      filteredUnits = filteredUnits.filter(unit => 
        unit.category?.toLowerCase() === params.category?.toLowerCase()
      );
    }

    // Apply sorting
    if (params.sortBy) {
      filteredUnits.sort((a, b) => {
        const aVal = a[params.sortBy!];
        const bVal = b[params.sortBy!];
        const modifier = params.sortOrder === 'desc' ? -1 : 1;
        return aVal < bVal ? -1 * modifier : aVal > bVal ? 1 * modifier : 0;
      });
    }

    // Apply pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || filteredUnits.length;
    const start = (page - 1) * pageSize;
    const paginatedUnits = filteredUnits.slice(start, start + pageSize);

    return {
      units: paginatedUnits,
      total: filteredUnits.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredUnits.length / pageSize)
    };
  }

  private getSalesforceFieldName(field: string): string {
    const fieldMap: Record<string, string> = {
      name: 'Name',
      price: 'BasePrice__c',
      category: 'Category__c',
      updatedAt: 'LastModifiedDate'
    };
    return fieldMap[field] || field;
  }

  private convertSalesforceUnit(sfUnit: any): Unit {
    return {
      id: sfUnit.Id,
      name: sfUnit.Name,
      description: sfUnit.Description__c,
      basePrice: sfUnit.BasePrice__c,
      category: sfUnit.Category__c,
      features: sfUnit.Features__c?.split(';'),
      active: sfUnit.Active__c,
      applicableDiscounts: sfUnit.ApplicableDiscounts__c?.split(';'),
      createdAt: sfUnit.CreatedDate,
      updatedAt: sfUnit.LastModifiedDate
    };
  }
}

export const configurationService = new ConfigurationService();
