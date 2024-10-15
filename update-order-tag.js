require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const xlsx = require('xlsx');

// Shopify credentials from environment variables
const SHOPIFY_API_ACCESS_TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-01`;

// File paths
const inputJsonFile = 'matching_orders.json';
const outputExcelFile = 'updated_orders.xlsx';

// Define the new tag to add
const newTag = 'antislip_1000_Oct_2024';

/**
 * Function to add a tag to an order
 * @param {Number} orderId - Shopify order ID
 * @param {String} existingTags - Existing tags of the order
 * @returns {Promise} - Promise indicating the success or failure of the API request
 */
async function addTagToOrder(orderId, existingTags) {
    const updatedTags = existingTags.includes(newTag)
        ? existingTags // If the tag already exists, don't add it again
        : `${existingTags}, ${newTag}`.trim();

    const url = `${SHOPIFY_API_URL}/orders/${orderId}.json`;

    const requestBody = {
        order: {
            id: orderId,
            tags: updatedTags
        }
    };

    try {
        await axios.put(url, requestBody, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        return { success: true, updatedTags };
    } catch (error) {
        console.error(`Error updating order ${orderId}:`, error.response ? error.response.data : error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Function to process orders and add tags
 */
async function processOrders() {
    // Read the JSON file containing the list of orders
    const rawData = fs.readFileSync(inputJsonFile, 'utf8');
    const orders = JSON.parse(rawData);

    // Array to track order processing results
    const orderTracking = [];

    // Loop through each order and attempt to add the new tag
    for (const order of orders) {
        const orderId = order.order_id;
        const existingTags = order.tags || '';

        // Attempt to add the tag to the order
        const result = await addTagToOrder(orderId, existingTags);

        // Push the result to the order tracking array
        orderTracking.push({
            Order_ID: orderId,
            Existing_Tags: existingTags,
            Updated_Tags: result.success ? result.updatedTags : 'Failed',
            Status: result.success ? 'Updated' : `Failed: ${result.error}`
        });
    }

    // Write the tracking data to an Excel file
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(orderTracking);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Order Tags Update');
    xlsx.writeFile(workbook, outputExcelFile);

    console.log(`Orders processed. Results written to ${outputExcelFile}`);
}

// Execute the function
processOrders();
