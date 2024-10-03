// Load environment variables
require('dotenv').config();
const axios = require('axios');

// Shopify credentials from environment variables
const SHOPIFY_API_ACCESS_TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

// Base URL for Shopify Admin API
const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-01`;

/**
 * Function to get transactions of an order
 * @param {String} orderId - The ID of the completed order
 */
async function getOrderTransactions(orderId) {
    try {
        const transactionUrl = `${SHOPIFY_API_URL}/orders/${orderId}/transactions.json`;

        const response = await axios.get(transactionUrl, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        const transactions = response.data.transactions;
        console.log('Order Transactions:', transactions);

        // Return the transactions for further processing
        return transactions;

    } catch (error) {
        console.error('Error fetching transactions:', error.response ? error.response.data : error.message);
    }
}

// Example usage: replace with the actual completed order ID
const orderId = '6219904188707'; // Replace with actual order ID
getOrderTransactions(orderId);
