// Load environment variables
require('dotenv').config();
const axios = require('axios');

// Shopify credentials from environment variables
const SHOPIFY_API_ACCESS_TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

// Base URL for Shopify Admin API
const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-01`;

/**
 * Function to issue a partial refund for an order
 * @param {String} orderId - The ID of the completed order
 * @param {Number} refundAmount - The amount to refund (in GBP)
 */
async function issuePartialRefund(orderId, refundAmount) {
    try {
        // Refund payload: specifying the refund amount and the reason
        const refundPayload = {
            refund: {
                transactions: [
                    {
                        amount: refundAmount,   // Amount to refund
                        kind: 'refund',         // Type of transaction
                        gateway: 'manual'       // Payment gateway (replace with actual gateway if needed)
                    }
                ],
                currency: 'GBP',              // Refund currency
                note: 'Partial refund for discount adjustment (BASEFORFREE)'
            }
        };

        // Make the request to issue a refund
        const refundUrl = `${SHOPIFY_API_URL}/orders/${orderId}/refunds.json`;
        const response = await axios.post(refundUrl, refundPayload, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        console.log('Refund issued successfully:', response.data);
    } catch (error) {
        console.error('Error issuing refund:', error.response ? error.response.data : error.message);
    }
}

// Example usage: replace with the actual order ID and refund amount
const orderId = '6233541443875'; // Replace with the actual completed order ID
const refundAmount = 5.00;     // Difference between GBP 5 and GBP 2
issuePartialRefund(orderId, refundAmount);
