// Load environment variables
require('dotenv').config();
const axios = require('axios');

// Shopify credentials from environment variables
const SHOPIFY_API_ACCESS_TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

// Base URL for Shopify Admin API
const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-01`;


// Function to cancel the order and mark as refunded
async function cancelOrder(orderId) {
    try {
        const cancelPayload = {
            refund: {
                note: 'Order canceled and marked as refunded for manual payment',
                notify: false,  // Notify customer about cancellation (set to true if needed)
            }
        };

        const cancelUrl = `${SHOPIFY_API_URL}/orders/${orderId}/cancel.json`;
        const response = await axios.post(cancelUrl, cancelPayload, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        console.log('Order canceled and marked as refunded:', response.data);
    } catch (error) {
        console.error('Error canceling order:', error.response ? error.response.data : error.message);
    }
}

// Example usage: replace with the actual completed order ID
cancelOrder('6233541443875');  // Replace with the actual order ID
