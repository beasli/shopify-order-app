require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// Shopify credentials from environment variables
const SHOPIFY_API_ACCESS_TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

// Base URL for Shopify Admin API
const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-01`;

// Define the target line item title and tag
const targetLineItemTitle = "Anti-Slip Silicone Base";
const targetTag = "silicone_fix";

// Array to hold orders that match the criteria
let matchingOrders = [];

/**
 * Fetch orders with a specific tag and cursor-based pagination support
 * @param {String} nextPageUrl - The URL for the next page of results, if any
 */
async function fetchOrdersWithTag(nextPageUrl = null) {
    try {
        let url;
        if (nextPageUrl) {
            url = nextPageUrl; // Use the next page URL if available
        } else {
            url = `${SHOPIFY_API_URL}/orders.json?status=any&limit=250&fields=id,tags,line_items,discount_codes&tag=${targetTag}`;
        }

        const response = await axios.get(url, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN
            }
        });

        return {
            orders: response.data.orders,
            nextPageUrl: getNextPageUrl(response.headers.link)
        };
    } catch (error) {
        console.error('Error fetching orders:', error.response ? error.response.data : error.message);
        return { orders: [], nextPageUrl: null };
    }
}

/**
 * Get the URL for the next page of results from the link headers
 * @param {String} linkHeader - The 'link' header returned from Shopify API response
 * @returns {String|null} - The next page URL or null if there is no next page
 */
function getNextPageUrl(linkHeader) {
    if (!linkHeader) {
        return null;
    }

    const links = linkHeader.split(',').map(link => link.trim());
    for (const link of links) {
        if (link.includes('rel="next"')) {
            return link.match(/<(.*)>/)[1]; // Extract the URL from the angled brackets
        }
    }

    return null;
}

/**
 * Check if the order contains the target line item and has no discounts
 * @param {Object} order - Order object
 * @returns {Boolean} - Returns true if the order meets the criteria
 */
function orderMeetsCriteria(order) {
    // Check if the order has the required tag
    if (!order.tags.includes(targetTag)) {
        return false;
    }

    // Check if the order has no discount codes applied
    if (order.discount_codes && order.discount_codes.length > 0) {
        return false;
    }

    // Check if the line item "Anti-Slip Silicone Base" exists in the order
    const hasTargetLineItem = order.line_items.some(item => item.title === targetLineItemTitle);
    
    return hasTargetLineItem;
}

/**
 * Main function to fetch and filter orders
 */
async function listMatchingOrders() {
    let nextPageUrl = null;

    do {
        // Fetch orders with the tag "silicone_fix" using cursor-based pagination
        const { orders, nextPageUrl: newNextPageUrl } = await fetchOrdersWithTag(nextPageUrl);

        // If no more orders are returned, stop the loop
        if (orders.length === 0) {
            console.log('No more orders found.');
            break;
        }

        // Loop through the orders and filter based on the criteria
        for (const order of orders) {
            if (orderMeetsCriteria(order)) {
                matchingOrders.push({
                    order_id: order.id,
                    tags: order.tags,
                    line_items: order.line_items,
                    discount_codes: order.discount_codes
                });
            }
        }

        // Update the next page URL for the next batch
        nextPageUrl = newNextPageUrl;
    } while (nextPageUrl);

    console.log(`Total matching orders: ${matchingOrders.length}`);

    // Write the matching orders to a JSON file for further inspection
    fs.writeFile('matching_orders.json', JSON.stringify(matchingOrders, null, 2), function (err) {
        if (err) {
            return console.error('Error writing JSON file:', err);
        }
        console.log('Matching orders written to matching_orders.json');
    });
}

// Execute the function to list matching orders
listMatchingOrders();
