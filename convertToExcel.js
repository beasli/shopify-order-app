const fs = require('fs');
const xlsx = require('xlsx');

// File paths
const inputJsonFile = 'matching_orders.json';
const outputExcelFile = 'matching_orders.xlsx';

// Function to convert JSON to Excel
function jsonToExcel() {
    // Read the JSON file
    fs.readFile(inputJsonFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading JSON file:', err);
            return;
        }

        // Parse JSON data
        const jsonData = JSON.parse(data);

        // Create a new workbook
        const workbook = xlsx.utils.book_new();

        // Convert JSON data to worksheet
        const worksheetData = jsonData.map(order => ({
            Order_ID: order.order_id,
            Tags: order.tags,
            Line_Item_Title: order.line_items.map(item => item.title).join(', '),
            Line_Item_Quantity: order.line_items.map(item => item.quantity).join(', '),
            Line_Item_Price: order.line_items.map(item => item.price).join(', '),
            Discount_Codes: order.discount_codes.map(code => code.code).join(', ')
        }));

        // Create a worksheet from the data
        const worksheet = xlsx.utils.json_to_sheet(worksheetData);

        // Append the worksheet to the workbook
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Matching Orders');

        // Write the workbook to an Excel file
        xlsx.writeFile(workbook, outputExcelFile);

        console.log(`Excel file created: ${outputExcelFile}`);
    });
}

// Execute the function
jsonToExcel();
