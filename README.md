# Codeium Quoting Tool

A web-based quoting tool for Codeium products integrated with Salesforce.

## Features

- Calculate quotes for Codeium Enterprise ($1,000/unit/year) and Cascade ($2,000/unit/year)
- Volume-based discounts (10% off for orders of 100+ units)
- Real-time quote calculation with debounced updates
- Demo mode with localStorage persistence
- Modern, responsive UI built with React and Material-UI
- TypeScript for type safety
- Salesforce integration (with demo fallback)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Salesforce credentials and configuration

## Demo Mode

For testing and development, use these demo credentials:
- Username: `demo@codeium.com`
- Password: `demo123!@#`

In demo mode:
- Quotes are stored in localStorage
- No actual Salesforce connection is required
- All quote data persists across browser sessions

## Components

### QuoteForm Component (`/src/components/QuoteForm.tsx`)

The main quote creation interface with the following features:

#### State Management
```typescript
// Main state
const [quoteItems, setQuoteItems] = useState<Record<string, string>>({});
const [totalAmount, setTotalAmount] = useState<number>(0);
const [subtotal, setSubtotal] = useState<number>(0);
const [discountApplied, setDiscountApplied] = useState<boolean>(false);
const [discountAmount, setDiscountAmount] = useState<number>(0);

// Reference for latest items
const latestItems = useRef<Record<string, string>>(quoteItems);
```

#### Key Functions

1. **Quote Calculation**
```typescript
const calculateQuote = useCallback(
  debounce((items: Record<string, string>) => {
    // Converts input to valid quote items
    // Calculates totals using backend service
    // Updates UI with new amounts
  }, 50),
  [resetCalculations]
);
```

2. **Input Handling**
```typescript
const handleUnitChange = (productId: string, value: string) => {
  // Validates input (numbers only)
  // Handles empty fields
  // Triggers recalculation
};
```

#### Performance Optimizations
- Debounced calculations (50ms delay)
- useRef for latest state tracking
- Immediate resets for empty fields
- Input validation to prevent invalid states

### Salesforce Service (`/src/services/salesforce.ts`)

Handles all quote calculations and storage:

#### Demo Mode Implementation
```typescript
// Quote Storage
private getDemoQuotes(): QuoteData[] {
  return JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '[]');
}

// Quote Calculation
calculateQuote(items: QuoteItem[]): QuoteCalculation {
  // Calculates subtotal
  // Applies volume discount (10% for 100+ units)
  // Returns complete calculation
}
```

## Volume Discount Rules

Current implementation:
- 10% discount applies when total units ≥ 100
- Applies across all products combined
- Calculated on subtotal before tax
- Displayed separately in UI

Example:
```
Subtotal: $100,000.00
Volume Discount (10%): -$10,000.00
Total Amount: $90,000.00
```

## Data Flow

1. User inputs unit quantities
2. Input validation occurs
3. Debounced calculation triggers
4. Backend service calculates totals
5. UI updates with new amounts
6. On save:
   - Quote is stored (localStorage in demo mode)
   - Form resets
   - Saved quotes list updates

## Error Handling

- Input validation prevents non-numeric values
- Immediate reset on empty fields
- Error state management for failed calculations
- Clear error messages in UI
- Fallback to zero for invalid calculations

## Browser Support

Tested and supported in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Mobile support:
- iOS Safari
- Android Chrome
- Responsive design for all screen sizes

## Development Guidelines

1. **State Updates**
   - Use `useCallback` for memoized functions
   - Implement proper cleanup in `useEffect`
   - Use refs for latest state access

2. **Performance**
   - Debounce user input
   - Memoize expensive calculations
   - Optimize rerenders

3. **Testing**
   - Test edge cases in calculations
   - Verify discount rules
   - Check input validation
   - Test persistence in demo mode

## Future Enhancements

- [ ] Support for custom discount rules
- [ ] Bulk quote creation
- [ ] Quote templates
- [ ] PDF export
- [ ] Multi-currency support
- [ ] Real-time collaboration
- [ ] Quote approval workflow
- [ ] Integration with other CRM systems

## Troubleshooting

Common issues and solutions:

1. **Calculation Delays**
   - Check network latency
   - Verify debounce timing
   - Monitor browser performance

2. **Storage Issues**
   - Clear localStorage if corrupted
   - Check browser storage limits
   - Verify quote data structure

3. **UI Glitches**
   - Reset form state
   - Clear browser cache
   - Check console for errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details
