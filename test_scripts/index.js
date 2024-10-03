// Load environment variables
require('dotenv').config();
const axios = require('axios');

// Shopify credentials from environment variables
const SHOPIFY_API_ACCESS_TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

// Base URL for Shopify Admin API
const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-01`;

/**
 * Function to fetch order details by order ID
 * @param {String} orderId - The ID of the order to fetch
 */
async function fetchOrderDetails(orderId) {
    try {
        // Construct the API endpoint URL
        const orderUrl = `${SHOPIFY_API_URL}/orders/${orderId}.json`;

        // Make the request to fetch the order details
        const response = await axios.get(orderUrl, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        // Get the order details from the response
        const order = response.data.order;

        // console.log('Line item added with discount successfully:', order);
        // return 0;

        // Log the order details to the console
        console.log('Order Details:');
        console.log(`ID: ${order.id}`);
        console.log(`Name: ${order.name}`);
        console.log(`Email: ${order.email}`);
        console.log(`Total Price: ${order.total_price}`);
        console.log(`Order Status: ${order.financial_status}`);
        console.log(`Created at: ${order.created_at}`);
        console.log(`Transactions: ${order.transactions}`);
        console.log(`Items:`);
        order.line_items.forEach((item) => {
            console.log(`- ${item.name} : ${item.id} - (${item.quantity} x ${item.price})`);
        });

        // Check for line item with the specific ID
        const specificLineItemName = 'Anti-Slip Silicone Base'; // Replace with the actual line item ID
        const specificLineItem = order.line_items.find(item => item.name.toString() === specificLineItemName);

        if (specificLineItem) {
            console.log(`Order contains the line item  ${specificLineItemName}. Removing it and adding a discounted version...`);
            // await removeLineItem(orderId, specificLineItem, order);
            await addLineItem(orderId, specificLineItem);
        } else {
            console.log(`Order does not contain the line item ${specificLineItemName}.`);
        }

    } catch (error) {
        console.error('Error fetching order details:', error.response ? error.response.data : error.message);
    }
}



/**
 * Function to remove a specific line item from the order by issuing a refund
 * @param {String} orderId - The ID of the order
 * @param {Object} lineItem - The line item object to be removed
 * @param {Object} order - The complete order object
 */
async function removeLineItem(orderId, lineItem, order) {
    try {
        // Find the parent transaction to link the refund
        const transaction = order.transactions.find(tr => tr.kind === 'sale' && tr.status === 'success');

        if (!transaction) {
            throw new Error('No valid transaction found to issue the refund.');
        }

        // Construct the refund payload to refund the line item
        const refundPayload = {
            refund: {
                notify: true, // Notify customer
                note: 'Removing Anti-Slip Silicone Base to reapply discount',
                transactions: [
                    {
                        kind: 'refund',
                        parent_id: transaction.id, // Reference the original transaction
                        gateway: transaction.gateway, // Include the gateway
                        amount: lineItem.price * lineItem.quantity
                    }
                ],
                refund_line_items: [
                    {
                        line_item_id: lineItem.id,
                        quantity: lineItem.quantity,
                        restock_type: 'no_restock'
                    }
                ]
            }
        };

        // Issue the refund for the line item
        const refundUrl = `${SHOPIFY_API_URL}/orders/${orderId}/refunds.json`;
        await axios.post(refundUrl, refundPayload, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        console.log('Line item removed and refunded successfully.');
    } catch (error) {
        console.error('Error removing line item:', error.response ? error.response.data : error.message);
    }
}

/**
 * Function to add a new line item to the order with a price of 0 GBP and a note
 * @param {String} orderId - The ID of the order
 * @param {Object} lineItem - The line item object to re-add with a discount
 */
async function addLineItem(orderId, lineItem) {
    try {
        // Prepare the payload to add the line item with 0 GBP price and a note
        const updatePayload = {
            order: {
                line_items: [
                    {
                        variant_id: lineItem.variant_id, // Ensure this matches the correct product
                        title: 'Anti-Slip Silicone Base',
                        quantity: 1,
                        price: '5.00', // Set the price to 0 GBP
                        total_discount: '5.00',
                        sku: 'CP3230',
                        properties: [
                            {
                                name: 'Note',
                                value: 'BASEFORFREE'
                            }
                        ]
                    }
                ]
            }
        };

        // Add the new line item with the discount
        const updateOrderUrl = `${SHOPIFY_API_URL}/orders/.json`;
        const response = await axios.post(updateOrderUrl, updatePayload, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        let order = response.data.order;

        // Log the order details to the console
        console.log('Order Details:');
        console.log(`ID: ${order.id}`);
        console.log(`Name: ${order.name}`);
        console.log(`Email: ${order.email}`);
        console.log(`Total Price: ${order.total_price}`);
        console.log(`Order Status: ${order.financial_status}`);
        console.log(`Created at: ${order.created_at}`);
        console.log(`Items:`);
        order.line_items.forEach((item) => {
            console.log(`- ${item.name} : ${item.id} - (${item.quantity} x ${item.price})`);
        });

        // console.log('Line item added with discount successfully:', response.data.order);

    } catch (error) {
        console.error('Error adding discounted line item:', error.response ? error.response.data : error.message);
    }
}

// Example usage: Replace with the actual order ID you want to fetch
const orderId = '6233073942819'; // Replace with the actual order ID
fetchOrderDetails(orderId);
