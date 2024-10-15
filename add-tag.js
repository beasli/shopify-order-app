require('dotenv').config();
const axios = require('axios');

// Shopify credentials from environment variables
const SHOPIFY_API_ACCESS_TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

// Base URL for Shopify Admin API
const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-01`;

// Define the tags we are working with
const existingTag = "silicone_fix";
const newTag = "antislip_1000_Oct_2024";

/**
 * Fetch all orders with the tag "silicone_fix"
 */
async function fetchOrdersWithTag() {
    try {
        const url = `${SHOPIFY_API_URL}/orders.json?status=any&limit=250&fields=id,tags&tag=${existingTag}`;
        const response = await axios.get(url, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        return response.data.orders;
    } catch (error) {
        console.error('Error fetching orders with tag:', error.response ? error.response.data : error.message);
        return [];
    }
}

/**
 * Update order by adding new tag "antislip_1000_Oct_2024"
 * @param {Object} order - Order object
 */
async function updateOrderWithNewTag(order) {
    try {
        // Split the existing tags into an array, add the new tag, and join them back into a string
        const tagsArray = order.tags.split(",").map(tag => tag.trim());
        if (!tagsArray.includes(newTag)) {
            tagsArray.push(newTag);
        }

        // Prepare the payload to update the order with the new tags
        const updatePayload = {
            order: {
                id: order.id,
                tags: tagsArray.join(", ")
            }
        };

        // Update the order
        const updateUrl = `${SHOPIFY_API_URL}/orders/${order.id}.json`;
        const response = await axios.put(updateUrl, updatePayload, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        console.log(`Successfully updated order ID ${order.id} with new tag.`);
    } catch (error) {
        console.error(`Error updating order ID ${order.id}:`, error.response ? error.response.data : error.message);
    }
}

/**
 * Main function to fetch orders with the tag "silicone_fix" and update them with the new tag
 */
async function addTagToOrders() {
    // Step 1: Fetch all orders that have the "silicone_fix" tag
    const orders = await fetchOrdersWithTag();

    if (orders.length === 0) {
        console.log('No orders found with the tag "silicone_fix".');
        return;
    }

    // Step 2: Loop through the orders and update each one with the new tag
    for (const order of orders) {
        await updateOrderWithNewTag(order);
    }

    console.log('All applicable orders have been updated.');
}

/**
 * Function to fetch the original order's details
 * @param {String} orderId - The ID of the original order
 */
async function addTagToOrderById(orderId) {
    try {
        const orderUrl = `${SHOPIFY_API_URL}/orders/${orderId}.json`;

        const response = await axios.get(orderUrl, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        await updateOrderWithNewTag(response.data.order);
    } catch (error) {
        console.error('Error fetching original order:', error.response ? error.response.data : error.message);
        return null;
    }
}

// Execute the function to add the tag
// addTagToOrders();

addTagToOrderById('6006823190755')
