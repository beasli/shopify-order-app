// Load environment variables
require('dotenv').config();
const axios = require('axios');

// Shopify credentials from environment variables
const SHOPIFY_API_ACCESS_TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

// Base URL for Shopify Admin API
const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-01`;


async function addDiscountLineItem(orderId) {
    try {
        const adjustmentPayload = {
            order: {
                line_items: [
                    {
                        title: 'Discount Adjustment (BASEFORFREE)',
                        price: -3.00,    // Negative value for discount adjustment
                        quantity: 1
                    }
                ]
            }
        };

        const orderUrl = `${SHOPIFY_API_URL}/orders/${orderId}.json`;
        const response = await axios.put(orderUrl, adjustmentPayload, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        console.log('Line item added successfully:', response.data);
    } catch (error) {
        console.error('Error adding line item:', error.response ? error.response.data : error.message);
    }
}

// Example usage: replace with the actual order ID
const orderId = '6233541443875'; // Replace with the actual completed order ID
addDiscountLineItem(orderId);
