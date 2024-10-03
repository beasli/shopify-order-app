# shopify-order-app

This Node.js script cancels an existing Shopify order and creates a new order with the same details but includes a discount and a modified order name. It utilizes the Shopify Admin API to handle both order cancellation and the creation of a discounted order.

# Prerequisites
Before running the script, ensure you have the following set up:

1. Shopify Store: You need an active Shopify store.
2. Shopify API Access Token: Generate a private app in Shopify to get an API key for interacting with the Shopify Admin API. 

# Install dependencies:
This script uses the axios library to interact with the Shopify API. Install it using npm:

npm install axios dotenv

# Configure environment variables:
Create a .env file in the root directory with the following variables:

SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_PASSWORD=your_shopify_api_password
SHOPIFY_API_ACCESS_TOKEN=your_shopify_access_token
SHOPIFY_STORE=your_shopify_store_name
 
# Script Details


# Main Functions
1. cancelOrder(orderId): Cancels an existing order using its ID.
2. fetchOriginalOrder(orderId): Fetches the details of the original order based on the provided ID.
3. createNewOrderWithDiscount(originalOrder): Creates a new order using the same details as the original order but applies a discount and modifies the order name.
4. cancelAndCreateDiscountedOrder(orderId): The main function that orchestrates canceling the original order and creating the new order with a discount.

# Key Features
1. Order Cancellation: Cancels the specified order and marks it as refunded or canceled in Shopify.
2. New Order Creation: Clones the original order data (customer details, line items, etc.) and creates a new order with a discount and an adjusted order name (adds -FreeBase as a suffix).
3. Discount Application: A fixed discount of GBP 5 is applied using a discount code BASEFORFREE.