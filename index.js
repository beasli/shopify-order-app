// Load environment variables
require('dotenv').config();
const axios = require('axios');

// Shopify credentials from environment variables
const SHOPIFY_API_ACCESS_TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

// Base URL for Shopify Admin API
const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-01`;

/**
 * Function to cancel the original order
 * @param {String} orderId - The ID of the original order
 */
async function cancelOrder(orderId) {
    try {
        const cancelUrl = `${SHOPIFY_API_URL}/orders/${orderId}/cancel.json`;

        const response = await axios.post(cancelUrl, {}, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        console.log('Order canceled successfully:', response.data);
        return true;
    } catch (error) {
        console.error('Error canceling order:', error.response ? error.response.data : error.message);
        return false;
    }
}

/**
 * Function to fetch the original order's details
 * @param {String} orderId - The ID of the original order
 */
async function fetchOriginalOrder(orderId) {
    try {
        const orderUrl = `${SHOPIFY_API_URL}/orders/${orderId}.json`;

        const response = await axios.get(orderUrl, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        return response.data.order;
    } catch (error) {
        console.error('Error fetching original order:', error.response ? error.response.data : error.message);
        return null;
    }
}

/**
 * Function to create a new order with a discount
 * @param {Object} originalOrder - The original order details
 */
async function createNewOrderWithDiscount(originalOrder) {
    try {
        const newOrderPayload = {
            order: {
                email: originalOrder.email,
                financial_status: 'paid',  //pending or paid
                send_receipt: false,  // Set to true if you want to email receipt to customer
                send_fulfillment_receipt: false,  // Set to true if you want to email fulfillment notification
                line_items: originalOrder.line_items.map(item => ({
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    price: item.price // Use the original price, discount will be applied separately
                })),
                shipping_address: originalOrder.shipping_address,
                billing_address: originalOrder.billing_address,
                discount_codes: [
                    {
                        code: 'BASEFORFREE',
                        amount: 5.00, // GBP discount amount
                        type: 'fixed_amount'
                    }
                ],
                currency: originalOrder.currency,
                customer: {
                    id: originalOrder.customer.id
                },
                note: 'This is a new order created with a discount',
                name: originalOrder.name + '-FreeBase'  // Add suffix to order name
            }
        };

        const orderUrl = `${SHOPIFY_API_URL}/orders.json`;
        const response = await axios.post(orderUrl, newOrderPayload, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        console.log('New order created successfully:', response.data);
    } catch (error) {
        console.error('Error creating new order:', error.response ? error.response.data : error.message);
    }
}

/**
 * Main function to cancel an order and create a new one with a discount
 * @param {String} orderId - The ID of the original order
 */
async function cancelAndCreateDiscountedOrder(orderId) {
    // Step 1: Fetch original order details
    const originalOrder = await fetchOriginalOrder(orderId);

    if (!originalOrder) {
        console.error('Original order not found. Exiting process.');
        return;
    }

    // Step 2: Cancel the original order
    const cancelSuccess = await cancelOrder(orderId);

    if (cancelSuccess) {
        // Step 3: Create a new order with a discount if the original order was successfully canceled
        await createNewOrderWithDiscount(originalOrder);
    } else {
        console.error('Failed to cancel the original order. New order creation aborted.');
    }
}

// Example usage: Replace with the actual original order ID
const originalOrderId = '6219881873699';  // Replace with the actual order ID
cancelAndCreateDiscountedOrder(originalOrderId); 
