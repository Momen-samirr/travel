# Flight Booking User Flow - Complete Proposal

## Overview
This document outlines the complete user flow for flight booking after clicking "Select" on a flight result, following Booking.com best practices and integrating with your existing booking system.

---

## Complete User Flow

### Step 1: Flight Selection & Review
**Page:** `/flights/select` (or `/flights/[offerId]/book`)
**Action:** User clicks "Select" button on flight result

**What happens:**
1. Store selected flight offer in session/localStorage (Amadeus offer data)
2. If round trip, store both outbound and return offers
3. Navigate to flight review page

**Data passed:**
- Flight offer ID (Amadeus offer ID)
- Outbound flight offer (full Amadeus response)
- Return flight offer (if round trip)
- Search parameters (origin, destination, dates, passengers, cabin class)

**Page components:**
- Flight summary card (outbound + return if applicable)
- Price breakdown (base price, taxes, fees)
- Passenger count display
- "Continue to Booking" button

---

### Step 2: Passenger Information
**Page:** `/flights/[offerId]/passengers`
**Action:** User enters passenger details

**What happens:**
1. Display number of passengers based on search (adults, children, infants)
2. Collect information for each passenger
3. Validate all required fields
4. Store passenger data temporarily

**Required information per passenger:**
- **Title** (Mr, Mrs, Miss, Ms)
- **First Name** (as on passport)
- **Last Name** (as on passport)
- **Date of Birth** (for children/infants)
- **Gender** (if required by airline)
- **Passport Number** (for international flights)
- **Passport Expiry Date** (for international flights)
- **Nationality** (for international flights)
- **Email** (primary contact - can be same for all)
- **Phone Number** (primary contact - can be same for all)
- **Special Requests** (wheelchair, meal preferences, etc.)

**Page components:**
- Passenger form (one per passenger, collapsible)
- Contact information section (shared)
- "Continue" button (disabled until all required fields filled)
- Progress indicator (Step 2 of 4)

**Validation:**
- All required fields must be filled
- Passport must be valid (not expired)
- Date of birth must match passenger type (adult/child/infant)
- Email format validation
- Phone number format validation

---

### Step 3: Add-ons & Extras (Optional)
**Page:** `/flights/[offerId]/extras`
**Action:** User selects optional services

**What happens:**
1. Display available add-ons based on flight offer
2. User selects desired extras
3. Update total price in real-time
4. Store selections temporarily

**Available add-ons:**
- **Seat Selection** (preferred seats, extra legroom, window/aisle)
- **Baggage** (additional checked bags if not included)
- **Meals** (special meals, pre-order)
- **Travel Insurance** (optional)
- **Airport Lounge Access** (optional)
- **Priority Boarding** (optional)

**Page components:**
- Add-ons list with prices
- Seat map (if available from airline)
- Price calculator (base + add-ons)
- "Continue to Review" button
- Progress indicator (Step 3 of 4)

**Note:** Some add-ons may require Amadeus API calls to get availability and pricing.

---

### Step 4: Booking Review & Confirmation
**Page:** `/flights/[offerId]/review`
**Action:** User reviews complete booking before payment

**What happens:**
1. Display complete booking summary
2. Show final price breakdown
3. Display terms and conditions checkbox
4. User confirms and proceeds to payment

**Page components:**
- **Flight Details Section:**
  - Outbound flight (airline, times, airports, duration, stops)
  - Return flight (if applicable)
  - Passenger names
  - Cabin class
  - Baggage allowance

- **Price Breakdown:**
  - Base fare
  - Taxes and fees
  - Add-ons (if any)
  - Total amount
  - Currency

- **Passenger Information Summary:**
  - All passenger names
  - Contact information

- **Terms & Conditions:**
  - Checkbox: "I agree to terms and conditions"
  - Cancellation policy
  - Refund policy

- **"Proceed to Payment" button**
- Progress indicator (Step 4 of 4)

**Important:** Before proceeding, confirm price with Amadeus API to ensure it hasn't changed.

---

### Step 5: Price Confirmation (Backend)
**API Call:** Confirm flight price with Amadeus before creating booking

**What happens:**
1. Call Amadeus price confirmation API with offer ID
2. Verify price matches original offer
3. If price changed, show warning to user
4. If price confirmed, proceed to booking creation

**API Endpoint:** `/api/amadeus/confirm`
**Data:** Flight offer ID

---

### Step 6: Booking Creation
**API Call:** Create booking in database

**What happens:**
1. Create booking record with:
   - User ID (from authentication)
   - Booking type: "FLIGHT"
   - Flight offer data (stored in JSON or separate table)
   - Passenger details (stored in `guestDetails` JSON)
   - Total amount (from confirmed price + add-ons)
   - Currency
   - Status: "PENDING"
   - Payment status: "PENDING"
   - Travel dates (from flight offer)

2. Store Amadeus offer ID for later reference
3. Return booking ID

**API Endpoint:** `/api/bookings` (POST)
**Data:**
```json
{
  "bookingType": "FLIGHT",
  "flightOfferId": "amadeus_offer_id",
  "outboundOffer": {...},
  "returnOffer": {...},
  "numberOfGuests": 2,
  "guestDetails": {
    "passengers": [...],
    "contact": {...}
  },
  "addOns": {...},
  "totalAmount": 1234.56,
  "currency": "EGP"
}
```

**Note:** Since flights are from Amadeus (not stored in DB), we need to:
- Store the full flight offer data in booking
- Or create a Flight record temporarily
- Or store in a separate `FlightBooking` table

---

### Step 7: Payment Selection
**Page:** `/bookings/[bookingId]/payment`
**Action:** User selects payment method

**What happens:**
1. Display booking summary
2. Show total amount
3. User selects payment method (Paymob or Bank)
4. Redirect to payment gateway

**Page components:**
- Booking summary card
- Payment method selection (radio buttons)
- Total amount display
- "Pay Now" button

**This page already exists:** `/bookings/[id]/payment/page.tsx`

---

### Step 8: Payment Processing
**Action:** User completes payment

**What happens:**
1. Redirect to payment gateway (Paymob or Bank)
2. User enters payment details
3. Payment processed
4. Webhook received with payment status
5. Booking updated:
   - Payment status: "PAID"
   - Booking status: "CONFIRMED"
   - Payment method stored
   - Transaction ID stored

**Webhooks:** Already implemented in `/api/webhooks/paymob` and `/api/webhooks/bank`

---

### Step 9: Booking Confirmation
**Page:** `/bookings/[bookingId]/confirmation`
**Action:** User sees confirmation after successful payment

**What happens:**
1. Display booking confirmation
2. Send confirmation email
3. Show booking reference number
4. Display flight details
5. Provide download options (ticket, invoice)

**Page components:**
- Success message
- Booking reference number
- Flight details summary
- Passenger information
- Price breakdown
- "Download Ticket" button
- "Download Invoice" button
- "View My Bookings" button
- "Book Another Flight" button

**Email sent:** Confirmation email with:
- Booking reference
- Flight details
- Passenger information
- Check-in information
- Contact support information

---

## Data Structure Considerations

### Option 1: Store Flight Offer in Booking (Recommended)
Store the complete Amadeus flight offer in the booking's `guestDetails` or a new JSON field:

```typescript
// In Booking model
flightOfferData: Json? // Store complete Amadeus offer
```

### Option 2: Create Temporary Flight Record
Create a Flight record in database with Amadeus offer data, then link to booking.

### Option 3: Separate FlightBooking Table
Create a dedicated table for flight bookings with all flight-specific data.

**Recommendation:** Option 1 - Store in JSON field for flexibility.

---

## Required Pages & Components

### New Pages Needed:
1. `/flights/select` - Flight review page
2. `/flights/[offerId]/passengers` - Passenger information
3. `/flights/[offerId]/extras` - Add-ons selection
4. `/flights/[offerId]/review` - Booking review
5. `/bookings/[bookingId]/confirmation` - Confirmation page (may need update)

### New Components Needed:
1. `FlightReviewCard` - Display flight summary
2. `PassengerForm` - Individual passenger form
3. `PassengerFormList` - Multiple passenger forms
4. `AddOnsSelector` - Add-ons selection component
5. `SeatMap` - Seat selection (if available)
6. `BookingSummary` - Complete booking summary
7. `PriceBreakdown` - Detailed price breakdown
8. `FlightConfirmation` - Confirmation display

### API Endpoints Needed:
1. `/api/amadeus/confirm` - Confirm flight price (may already exist)
2. `/api/bookings` - Create booking (exists, may need update for flights)
3. `/api/flights/offers/[id]` - Get flight offer details (optional)

---

## Authentication Flow

### Guest Checkout vs Logged-in User

**Option A: Require Login (Recommended)**
- User must be logged in to book
- Redirect to sign-in if not authenticated
- Pre-fill user information in passenger form

**Option B: Guest Checkout**
- Allow booking without account
- Collect email for confirmation
- Option to create account after booking
- Link booking to account if user signs up later

**Recommendation:** Option A - Require login for better booking management.

---

## Error Handling & Edge Cases

### Price Changes
- If price increased: Show warning, ask user to confirm
- If price decreased: Use lower price (good UX)
- If flight no longer available: Show error, redirect to search

### Session Expiry
- Flight offers expire after 15-30 minutes
- Warn user if offer is about to expire
- Re-confirm price before booking creation

### Payment Failures
- Allow retry payment
- Show clear error messages
- Provide support contact

### Multiple Bookings
- Handle concurrent bookings
- Prevent double-booking
- Queue system if needed

---

## Optional Enhancements

### 1. Seat Selection
- Integrate with airline seat maps (if available via Amadeus)
- Show available seats in real-time
- Charge for premium seats

### 2. Baggage Calculator
- Show baggage allowance included
- Calculate additional baggage costs
- Visual baggage size guide

### 3. Travel Insurance
- Offer travel insurance during booking
- Calculate insurance cost based on trip value
- Integrate with insurance provider API

### 4. Frequent Flyer Programs
- Allow users to enter frequent flyer numbers
- Store in passenger information
- Pass to airline during booking

### 5. Special Services
- Wheelchair assistance
- Special meals (vegetarian, halal, etc.)
- Unaccompanied minor services
- Pet travel

### 6. Price Alerts
- If user abandons booking, offer price alerts
- Notify if price drops
- Re-engage users

### 7. Booking Modifications
- Allow changes (with fees)
- Allow cancellations (with refund policy)
- Self-service modification portal

### 8. Mobile App Features
- Mobile check-in
- Digital boarding passes
- Flight status notifications
- Gate change alerts

---

## Implementation Priority

### Phase 1: Core Flow (MVP)
1. Flight selection & review page
2. Passenger information form
3. Booking review page
4. Booking creation API update
5. Payment integration (already exists)
6. Confirmation page

### Phase 2: Enhancements
1. Add-ons selection
2. Seat selection (if available)
3. Price confirmation with Amadeus
4. Enhanced error handling

### Phase 3: Advanced Features
1. Travel insurance
2. Frequent flyer integration
3. Booking modifications
4. Mobile optimizations

---

## Technical Considerations

### Amadeus Integration
- Flight offers expire - need to handle expiry
- Price confirmation required before booking
- May need to call Amadeus booking API (if available)
- Store Amadeus offer ID for reference

### Database Schema Updates
- May need to add `flightOfferData` JSON field to Booking
- Or create FlightBooking table
- Store passenger details in structured format

### State Management
- Use session storage for flight offer data
- Or pass via URL params (limited size)
- Or store in database temporarily

### Performance
- Optimize passenger form rendering
- Lazy load add-ons
- Cache flight offer data
- Optimize confirmation page

---

## User Experience Best Practices

1. **Progress Indicator:** Show step progress (1 of 4, 2 of 4, etc.)
2. **Auto-save:** Save form data as user types
3. **Validation:** Real-time validation with helpful error messages
4. **Loading States:** Show loading during API calls
5. **Error Recovery:** Allow users to go back and fix errors
6. **Mobile First:** Ensure all pages work on mobile
7. **Accessibility:** WCAG 2.1 AA compliance
8. **Clear CTAs:** Prominent, clear call-to-action buttons
9. **Trust Signals:** Security badges, refund policy, support info
10. **Confirmation:** Clear confirmation after each step

---

## Summary

The complete flow is:
1. **Select Flight** → Review flight details
2. **Enter Passengers** → Collect all passenger information
3. **Select Add-ons** → Optional extras (seats, baggage, etc.)
4. **Review Booking** → Complete summary before payment
5. **Confirm Price** → Verify with Amadeus API
6. **Create Booking** → Store in database
7. **Select Payment** → Choose payment method
8. **Process Payment** → Complete payment
9. **Confirmation** → Show success and send email

This flow ensures a smooth, trustworthy booking experience similar to Booking.com while integrating seamlessly with your existing booking and payment infrastructure.

