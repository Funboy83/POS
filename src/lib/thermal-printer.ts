/**
 * Thermal Receipt Printer Utility
 * Formats and prints receipts for thermal printers (80mm standard)
 */

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptData {
  invoiceId: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  customerName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  tenderedAmount?: number;
  changeGiven?: number;
  date: Date;
}

/**
 * Generate HTML for thermal receipt printer
 * Optimized for 80mm thermal printers
 */
export function generateThermalReceipt(data: ReceiptData): string {
  const {
    invoiceId,
    storeName = 'NNE Convenient Store',
    storeAddress = '',
    storePhone = '',
    customerName,
    items,
    subtotal,
    discount,
    tax,
    total,
    paymentMethod,
    tenderedAmount,
    changeGiven,
    date
  } = data;

  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Build receipt HTML
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${invoiceId}</title>
  <style>
    @media print {
      @page {
        margin: 0;
        size: 80mm auto;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.4;
      width: 80mm;
      margin: 0 auto;
      padding: 10mm 5mm;
      color: #000;
      background: #fff;
    }
    
    .header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
    }
    
    .store-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .store-info {
      font-size: 10px;
      margin: 2px 0;
    }
    
    .receipt-info {
      margin: 15px 0;
      font-size: 11px;
    }
    
    .receipt-info div {
      margin: 3px 0;
    }
    
    .items-table {
      width: 100%;
      margin: 15px 0;
      border-collapse: collapse;
    }
    
    .items-table th {
      text-align: left;
      border-bottom: 1px solid #000;
      padding: 5px 0;
      font-size: 11px;
    }
    
    .items-table td {
      padding: 5px 0;
      font-size: 11px;
    }
    
    .item-name {
      width: 60%;
    }
    
    .item-qty {
      width: 15%;
      text-align: center;
    }
    
    .item-price {
      width: 25%;
      text-align: right;
    }
    
    .totals {
      margin-top: 15px;
      border-top: 1px solid #000;
      padding-top: 10px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      font-size: 12px;
    }
    
    .totals-row.total {
      font-size: 16px;
      font-weight: bold;
      border-top: 2px solid #000;
      padding-top: 8px;
      margin-top: 8px;
    }
    
    .payment-info {
      margin: 15px 0;
      padding: 10px 0;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
    }
    
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 10px;
    }
    
    .thank-you {
      font-size: 14px;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .barcode {
      text-align: center;
      margin: 15px 0;
      font-family: 'Libre Barcode 128', monospace;
      font-size: 48px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">${storeName}</div>
    ${storeAddress ? `<div class="store-info">${storeAddress}</div>` : ''}
    ${storePhone ? `<div class="store-info">Tel: ${storePhone}</div>` : ''}
  </div>

  <div class="receipt-info">
    <div><strong>Invoice #:</strong> ${invoiceId.slice(0, 12)}</div>
    <div><strong>Date:</strong> ${formattedDate} ${formattedTime}</div>
    ${customerName ? `<div><strong>Customer:</strong> ${customerName}</div>` : ''}
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th class="item-name">Item</th>
        <th class="item-qty">Qty</th>
        <th class="item-price">Price</th>
      </tr>
    </thead>
    <tbody>
`;

  // Add items
  items.forEach(item => {
    html += `
      <tr>
        <td class="item-name">${item.name}</td>
        <td class="item-qty">${item.quantity}</td>
        <td class="item-price">$${item.total.toFixed(2)}</td>
      </tr>
`;
  });

  html += `
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>$${subtotal.toFixed(2)}</span>
    </div>
`;

  if (discount > 0) {
    html += `
    <div class="totals-row">
      <span>Discount:</span>
      <span>-$${discount.toFixed(2)}</span>
    </div>
`;
  }

  if (tax > 0) {
    html += `
    <div class="totals-row">
      <span>Tax:</span>
      <span>$${tax.toFixed(2)}</span>
    </div>
`;
  }

  html += `
    <div class="totals-row total">
      <span>TOTAL:</span>
      <span>$${total.toFixed(2)}</span>
    </div>
  </div>

  <div class="payment-info">
    <div class="totals-row">
      <span>Payment Method:</span>
      <span>${paymentMethod.toUpperCase()}</span>
    </div>
`;

  if (tenderedAmount !== undefined && paymentMethod.toLowerCase() === 'cash') {
    html += `
    <div class="totals-row">
      <span>Cash Tendered:</span>
      <span>$${tenderedAmount.toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span>Change:</span>
      <span>$${(changeGiven || 0).toFixed(2)}</span>
    </div>
`;
  }

  html += `
  </div>

  <div class="footer">
    <div class="thank-you">Thank You!</div>
    <div>Please come again</div>
    <div style="margin-top: 10px;">Questions? Call ${storePhone || 'us'}</div>
  </div>
</body>
</html>
`;

  return html;
}

/**
 * Print thermal receipt
 * Opens print dialog with formatted receipt
 */
export async function printThermalReceipt(data: ReceiptData): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const html = generateThermalReceipt(data);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=300,height=600');
      
      if (!printWindow) {
        reject(new Error('Failed to open print window. Please allow pop-ups.'));
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          
          // Close the window after printing (with a small delay)
          setTimeout(() => {
            printWindow.close();
            resolve();
          }, 500);
        }, 250);
      };

      // Handle print dialog cancel
      printWindow.onafterprint = () => {
        printWindow.close();
        resolve();
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Preview receipt without printing
 * Opens receipt in new window for preview
 */
export function previewReceipt(data: ReceiptData): void {
  const html = generateThermalReceipt(data);
  const previewWindow = window.open('', '_blank', 'width=400,height=700');
  
  if (!previewWindow) {
    alert('Failed to open preview window. Please allow pop-ups.');
    return;
  }

  previewWindow.document.write(html);
  previewWindow.document.close();
}

/**
 * Get receipt as HTML string (for email or storage)
 */
export function getReceiptHTML(data: ReceiptData): string {
  return generateThermalReceipt(data);
}
