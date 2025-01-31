# Admin Panel Documentation

## Overview
The Admin Panel provides an interface for managing product pricing and discount rules. It allows administrators to view and modify prices and discount rules in real-time.

## Features

### Product Pricing Management
- View current prices for all products
- Update product prices with real-time validation
- Changes are immediately reflected in the quote calculator

### Discount Rules Management
- View and modify volume-based discount rules
- Set discount thresholds and percentages
- Changes take effect immediately

## Implementation Details

### Price Updates
The pricing system maintains a history of price changes through effective dates. The Admin Panel always shows the most recent active price for each product. When updating prices:

1. The system validates the new price value
2. The update button becomes enabled only when the new value differs from the current price
3. Updates are tracked with effective dates to maintain pricing history

### Discount Rule Updates
Discount rules are uniquely identified by their name and type. The system ensures:

1. Only one active rule exists for each name-type combination
2. Updates are tracked with effective dates
3. Changes are validated before being saved

## Technical Implementation

### State Management
```typescript
interface PriceUpdate {
  productId: string;
  newPrice: string;
  hasChanged: boolean;
}

interface DiscountUpdate {
  ruleId: string;
  threshold: string;
  discountPercentage: string;
  hasChanged: boolean;
}
```

The Admin Panel tracks changes using these interfaces to ensure proper validation and update handling.

### Deduplication Logic
To prevent duplicate entries and ensure only the most recent rules are shown:

1. **Price Rules**:
   ```typescript
   const latestRules = new Map<string, PricingRule>();
   rules.forEach(rule => {
     const existingRule = latestRules.get(rule.productId);
     if (!existingRule || new Date(rule.effectiveDate) > new Date(existingRule.effectiveDate)) {
       latestRules.set(rule.productId, rule);
     }
   });
   ```

2. **Discount Rules**:
   ```typescript
   const latestRules = new Map<string, DiscountRule>();
   rules.forEach(rule => {
     const key = `${rule.name}-${rule.type}`;
     const existingRule = latestRules.get(key);
     if (!existingRule || new Date(rule.effectiveDate) > new Date(existingRule.effectiveDate)) {
       latestRules.set(key, rule);
     }
   });
   ```

### Change Detection
The system tracks changes by:
1. Maintaining current values in state
2. Comparing new input against current values
3. Enabling update buttons only when values have actually changed

### Error Handling
- Input validation ensures prices and discounts are valid numbers
- Loading states prevent multiple simultaneous updates
- Error messages provide clear feedback when updates fail

## Best Practices

1. **Price Updates**:
   - Always verify the current price before making changes
   - Use whole numbers for prices to avoid floating-point issues
   - Consider the impact on existing quotes before making significant price changes

2. **Discount Rules**:
   - Keep threshold values consistent with your business logic
   - Ensure discount percentages are reasonable (e.g., 0-100%)
   - Document any special discount rules that may affect pricing

## Troubleshooting

### Common Issues

1. **Update Button Disabled**:
   - Verify that the new value is different from the current value
   - Check that the input is a valid number
   - Ensure you have proper permissions

2. **Changes Not Saving**:
   - Check network connectivity
   - Verify that the values are within acceptable ranges
   - Look for error messages in the console

3. **Duplicate Entries**:
   - Clear browser cache and reload
   - Check if multiple rules were created with different effective dates
   - Contact system administrator if duplicates persist

## API Reference

### Configuration Service Methods

```typescript
interface ConfigurationService {
  getPricingRules(): Promise<PricingRule[]>;
  getDiscountRules(): Promise<DiscountRule[]>;
  updatePricingRule(productId: string, price: number): Promise<void>;
  updateDiscountRule(ruleId: string, updates: Partial<DiscountRule>): Promise<void>;
}
```

These methods handle all interactions with the pricing and discount rules system.
