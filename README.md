# Codeium Quoting Tool

A web-based quoting tool for Codeium products integrated with Salesforce.

## Added Functionality:
- Admin Panel to add more units, change discount rates, etc.
- Ability to save quotes as a PDF
- Account-Based Discounts
- Different Account Types (Admin, Enterprise, Student..)
- Search functionality for units
- Feature Tagging/Search for units
- Merges identical units in the quote/prevents duplicate unit selections
- Maintains selected units when filtering/searching
- Feature-based filtering
- Autocomplete unit selection
- Clear discount visibility

### Salesforce Integration:
- Connected to test Salesforce instance
- OAuth2 authentication

## How to Use:

Visit https://quoting-tool-en2jdfp7q-austin-manns-projects.vercel.app/ 
Use Admin Login Displayed on Screen

### Specify Discounts:
1. Click on Admin Panel
2. Click on Discounts
3. Click on Pencil under Actions
4. Adjust Based on Current Discount Rate
5. Click on Units
6. Click Pencil icon under Status
7. Apply discounts or adjust Unit attributes as needed
8. Click Save Changes
	
### Create a Quote:
1. In "New Quote" tab Enter quote name
2. Search for and products using the dropdown
3. Specify quantities
4. Discounts apply automatically based on:
   - Account Type
   - Unit Specific Discount
   - Number of units selected

### Save Quote:
In "Quotes" tab, access all past quotes and download with the Download PDF button
## Features

- Calculate quotes for Various Units
- Volume-based discounts (10% off for orders of 100+ units)
- Demo mode with localStorage persistence
- Salesforce integration (with demo fallback)













## Optional Setup

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


