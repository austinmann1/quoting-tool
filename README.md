# Codeium Quoting Tool

A web-based quoting tool for Codeium products integrated with Salesforce.

## Features

- Calculate quotes for Various Units
- Volume-based discounts (10% off for orders of 100+ units)
- Demo mode with localStorage persistence
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
- Username: `admin@codeium.com`
- Password: `admin123!@#`

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


