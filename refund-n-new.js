// Load environment variables
require('dotenv').config();
const axios = require('axios');

// Shopify credentials from environment variables
const SHOPIFY_API_ACCESS_TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

// Base URL for Shopify Admin API
const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-01`;

/**
 * Function to fetch transaction details for an order
 * @param {String} orderId - The ID of the original order
 */
async function fetchOrderTransaction(orderId) {
    try {
        const transactionUrl = `${SHOPIFY_API_URL}/orders/${orderId}/transactions.json`;

        const response = await axios.get(transactionUrl, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        const transactions = response.data.transactions;
        const originalTransaction = transactions.find(transaction => transaction.kind === 'sale');
        
        if (originalTransaction) {
            return originalTransaction.id;
        } else {
            console.error('No sale transaction found for the order.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching transaction:', error.response ? error.response.data : error.message);
        return null;
    }
}

/**
 * Function to refund the original order
 * @param {String} orderId - The ID of the original order
 * @param {String} parentId - The ID of the original transaction to be refunded
 */
async function refundOrder(orderId, parentId) {
    try {
        const refundUrl = `${SHOPIFY_API_URL}/orders/${orderId}/refunds.json`;
        
        const refundPayload = {
            refund: {
                notify: false, // Do not send refund notification to the customer
                transactions: [
                    {
                        kind: 'refund',
                        gateway: 'manual',
                        parent_id: parentId, // The parent transaction ID required for non-manual gateways
                        amount: 0.00 // Amount to refund (adjust based on the original order total)
                    }
                ]
            }
        };

        const response = await axios.post(refundUrl, refundPayload, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        console.log('Refund issued successfully:', response.data);
        return true;
    } catch (error) {
        console.error('Error issuing refund:', error.response ? error.response.data : error.message);
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
 * Function to create a new order with a discount and mark as fulfilled
 * @param {Object} originalOrder - The original order details
 */
async function createNewOrderWithDiscount(originalOrder) {
    try {
        const newOrderPayload = {
            order: {
                email: originalOrder.email,
                financial_status: 'paid',
                send_receipt: false, // Disable customer receipt email
                send_fulfillment_receipt: false, // Disable fulfillment email
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
                name: originalOrder.name + '-DISCOUNTED',
                fulfillment_status: 'fulfilled' // Mark as fulfilled
            }
        };

        const orderUrl = `${SHOPIFY_API_URL}/orders.json`;
        const response = await axios.post(orderUrl, newOrderPayload, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        console.log('New order created successfully:', response.data);

        return response.data.order;
    } catch (error) {
        console.error('Error creating new order:', error.response ? error.response.data : error.message);
        return null;
    }
}

/**
 * Main function to refund an order and create a new one with a discount
 * @param {String} orderId - The ID of the original order
 */
async function refundAndCreateDiscountedOrder(orderId) {
    // Step 1: Fetch original order details
    const originalOrder = await fetchOriginalOrder(orderId);

    if (!originalOrder) {
        console.error('Original order not found. Exiting process.');
        return;
    }

    // Step 2: Fetch the transaction for the order to get the parent_id
    const parentId = await fetchOrderTransaction(orderId);

    if (!parentId) {
        console.error('Transaction not found or parent_id missing. Exiting process.');
        return;
    }

    // Step 3: Refund the original order
    const refundSuccess = await refundOrder(orderId, parentId);

    if (refundSuccess) {
        // Step 4: Create a new order with a discount after refunding the original order
        const newOrder = await createNewOrderWithDiscount(originalOrder);
    } else {
        console.error('Failed to refund the original order. New order creation aborted.');
    }
}

// Example usage: Replace with the actual original order ID
const originalOrderId = '6235907621155';  // Replace with the actual order ID
refundAndCreateDiscountedOrder(originalOrderId);
