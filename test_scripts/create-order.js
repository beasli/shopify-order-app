// Load environment variables
require('dotenv').config();
const axios = require('axios');

// Shopify credentials from environment variables
const SHOPIFY_API_ACCESS_TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

// Base URL for Shopify Admin API
const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-01`;

/**
 * Function to create an order for the product 'Anti-Slip Silicone Base' with a GBP 5 discount
 * @param {String} variantId - The variant ID of the product
 */
async function createOrderWithDiscount(variantId) {
    try {
        // Prepare the payload for creating the order with a GBP 5 discount
        const orderPayload = {
            draft_order: {
                line_items: [
                    {
                        variant_id: variantId, // The variant ID for 'Anti-Slip Silicone Base'
                        quantity: 1,           // Quantity of the item
                        price: 10.00           // Assume original price is GBP 10 (replace with actual price)
                    }
                ],
                // applied_discount: {
                //     value: 5.00,             // GBP 5 discount
                //     value_type: 'fixed_amount',
                //     title: 'GBP 5 Discount',
                //     description: 'Applying a GBP 5 discount for Anti-Slip Silicone Base'
                // },
                currency: 'GBP',             // Currency for the order
                customer: {
                    first_name: 'John',      // Replace with actual customer details
                    last_name: 'Doe',
                    email: 'john.doe@example.com'
                },
                billing_address: {
                    first_name: 'John',
                    last_name: 'Doe',
                    address1: '123 Example Street',
                    city: 'London',
                    province: 'England',
                    country: 'GB',
                    zip: 'SW1A 1AA'
                },
                shipping_address: {
                    first_name: 'John',
                    last_name: 'Doe',
                    address1: '123 Example Street',
                    city: 'London',
                    province: 'England',
                    country: 'GB',
                    zip: 'SW1A 1AA'
                }
            }
        };

        // Make the request to create the draft order
        const createOrderUrl = `${SHOPIFY_API_URL}/draft_orders.json`;
        const response = await axios.post(createOrderUrl, orderPayload, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        // Get the created order details from the response
        const draftOrder = response.data.draft_order;
        console.log('Draft Order created successfully:', draftOrder);

        // Optionally, complete the draft order to create a finalized order
        await completeOrder(draftOrder.id);
    } catch (error) {
        console.error('Error creating draft order:', error.response ? error.response.data : error.message);
    }
}

/**
 * Function to complete a draft order
 * @param {String} draftOrderId - The ID of the draft order to complete
 */
async function completeOrder(draftOrderId) {
    try {
        // Make the request to complete the draft order
        const completeOrderUrl = `${SHOPIFY_API_URL}/draft_orders/${draftOrderId}/complete.json`;
        const response = await axios.put(completeOrderUrl, null, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        // Get the finalized order details from the response
        const order = response.data.order;
        console.log('Order completed successfully:', order);
    } catch (error) {
        console.error('Error completing draft order:', error.response ? error.response.data : error.message);
    }
}

// Example usage: Replace with the actual variant ID of 'Anti-Slip Silicone Base'
const variantId = '49060125901091'; // Replace with actual variant ID
createOrderWithDiscount(variantId);
