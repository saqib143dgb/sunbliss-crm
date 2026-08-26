# Smart New Customer form

This compatibility patch enhances the existing New Customer workflow without replacing the underlying customer/unit/sale/payment-schedule data model.

- Unit No. derives Floor from the first digit after the dash, with manual override.
- Area × Price/sqft derives Total Price.
- Sold by uses the fixed RM list.
- Individual sales capture an individual source name.
- Only DP, 1st, DLD/Admin and Final are shown initially; 2nd–7th are progressively revealed.
- Percentage fields derive installment amounts, with AED 5,100 added to DLD/Admin.
- Final is the remaining balance and defaults to 31 Oct 2027.
- Booking Amount is written once to payment transaction history after customer creation.
