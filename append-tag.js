require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const { Parser } = require('json2csv');

// Shopify credentials from environment variables
const SHOPIFY_API_ACCESS_TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

// Base URL for Shopify Admin API
const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-01`;

// Define the tags we are working with
const existingTag = "silicone_fix";
const newTag = "antislip_1000_Oct_2024";

// Limit of orders to update
const ORDER_UPDATE_LIMIT = 1000;

// Array to hold the log data for the CSV
let logData = [];

/**
 * Fetch orders with a specific tag and pagination support
 * @param {Number} page - The page number for pagination
 * @param {Number} limit - Number of orders to fetch per page
 */
async function fetchOrdersWithTag(page, limit) {
    try {
        const url = `${SHOPIFY_API_URL}/orders.json?status=any&limit=${limit}&page=${page}&fields=id,tags&tag=${existingTag}`;
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
        await axios.put(updateUrl, updatePayload, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        console.log(`Successfully updated order ID ${order.id} with new tag.`);

        // Log success in the logData array
        logData.push({
            order_id: order.id,
            status: 'Updated',
            reason: 'Successfully updated'
        });
    } catch (error) {
        console.error(`Error updating order ID ${order.id}:`, error.response ? error.response.data : error.message);

        // Log failure in the logData array
        logData.push({
            order_id: order.id,
            status: 'Failed',
            reason: error.response ? error.response.data.errors : error.message
        });
    }
}

/**
 * Main function to fetch and update orders
 */
async function addTagToOrders() {
    let page = 1;
    let totalUpdated = 0;
    const limit = 250; // Shopify API allows max 250 orders per request

    while (totalUpdated < ORDER_UPDATE_LIMIT) {
        // Fetch orders with the tag "silicone_fix" using pagination
        const orders = await fetchOrdersWithTag(page, limit);

        // If no more orders are returned, stop the loop
        if (orders.length === 0) {
            console.log('No more orders found with the tag "silicone_fix".');
            break;
        }

        // Loop through the orders and update them
        for (const order of orders) {
            if (totalUpdated >= ORDER_UPDATE_LIMIT) {
                break; // Stop once 1,000 orders are updated
            }

            await updateOrderWithNewTag(order);
            totalUpdated += 1;
        }

        // Increment the page number for the next batch
        page += 1;
    }

    console.log(`Total updated orders: ${totalUpdated}`);

    // Write the log data to a CSV file
    writeLogToCSV();
}

/**
 * Write the log data to a CSV file
 */
function writeLogToCSV() {
    const csvFields = ['order_id', 'status', 'reason'];
    const json2csvParser = new Parser({ fields: csvFields });
    const csv = json2csvParser.parse(logData);

    // Write to a CSV file
    fs.writeFile('order_tag_update_log.csv', csv, function (err) {
        if (err) {
            return console.error('Error writing CSV file:', err);
        }
        console.log('Log data successfully written to order_tag_update_log.csv');
    });
}

// Execute the function to add the tag
addTagToOrders();
