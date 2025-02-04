# Codeium Quoting Tool

A web-based quoting tool for Codeium products integrated with Salesforce.

## Added Functionality

- **Admin Panel** to add more units, change discount rates, etc.
- Ability to **save quotes as a PDF**.
- **Account-Based Discounts**.
- Different **Account Types** (Admin, Enterprise, Student…).
- **Search** functionality for units.
- **Feature Tagging/Search** for units.
- Merges identical units in the quote (prevents duplicate unit selections).
- Maintains selected units when filtering/searching.
- **Feature-based filtering**.
- **Autocomplete** unit selection.
- Clear discount visibility.
- **User Authentication and Access Control**:
  - Username/password authentication
  - Role-based access control (Admin vs Regular users)
  - User-specific quote management
- **Salesforce Integration** (Beta):
  - Basic CRUD operations for quotes

## How to Use:

Visit https://quoting-tool-two.vercel.app/
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

## Testing

The application includes comprehensive test coverage:

### Unit Tests
- `auth.test.ts`: Authentication service and user session management
- `quotes.test.ts`: Quote creation, retrieval, and calculations
- `configuration.test.ts`: Discount rules and pricing configuration

### Component Tests
- `App.test.tsx`: Core application routing and layout
- `LoginForm.test.tsx`: User authentication flow
- `QuoteForm.test.tsx`: Quote creation and editing
- `AdminPanel.test.tsx`: Administrative functions

### Integration Tests
- `App.integration.test.tsx`: End-to-end user flows
- Quote creation with automatic discount application
- PDF generation and download
- Admin panel operations


## Future Improvements

### Security & Authentication
- Replace local auth (credentials stored as plaintext) with Firebase Authentication

### Database & Storage
- Finish Salesforce integration using either:
  - OAuth2 for proper secure authentication
  - Connect through a backend API (more secure and allows all users access to the same DB)
- Alternative: Use Firestore


Run tests with:
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Storage Options

The application supports two storage options:

### Local Storage (Default)
By default, the application uses browser local storage to store quotes and configuration. This is perfect for development and testing.

### Salesforce Integration (Beta)
The application can use Salesforce as a storage backend. Current status:
- Basic CRUD operations for quotes (create, read, update, delete)
- Quote storage in custom Salesforce objects

To connect to Salesforce:

1. Configure environment variables:
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your Salesforce credentials
REACT_APP_STORAGE_TYPE=salesforce
REACT_APP_SF_LOGIN_URL=your-salesforce-instance
```

2. Set up Salesforce schema:
```sql
-- Required Custom Objects
Quote__c:
  - Name (Text)
  - Total__c (Currency)
  - Items__c (Long Text Area)
  - Status__c (Picklist)
```

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

## Demo Mode

For testing, use these demo accounts:

### Demo Accounts

You can use these accounts to test different user roles:

1. **Demo User (Individual Account)**
   - Username: demo@codeium.com
   - Password: demo123!@#
   - Features: Can view and create quotes

2. **Admin User (Enterprise Account)**
   - Username: admin@codeium.com
   - Password: admin123!@#
   - Features: Full access, including pricing management

3. **Student User (Student Account)**
   - Username: student@codeium.com
   - Password: student123!@#
   - Features: Can view and create quotes, eligible for student discounts

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
