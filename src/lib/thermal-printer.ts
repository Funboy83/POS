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
 * Generate barcode using Code 128 font simulation with bars
 * Creates a simple barcode representation for the invoice ID
 */
function generateBarcodeHTML(invoiceId: string): string {
  // Use the full invoice ID for the barcode
  const barcodeValue = invoiceId;
  
  return `
    <div class="barcode-container">
      <svg class="barcode-svg" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="2" height="30" fill="black"/>
        <rect x="9" y="5" width="1" height="30" fill="black"/>
        <rect x="12" y="5" width="3" height="30" fill="black"/>
        <rect x="17" y="5" width="1" height="30" fill="black"/>
        <rect x="20" y="5" width="2" height="30" fill="black"/>
        <rect x="24" y="5" width="1" height="30" fill="black"/>
        <rect x="27" y="5" width="3" height="30" fill="black"/>
        <rect x="32" y="5" width="2" height="30" fill="black"/>
        <rect x="36" y="5" width="1" height="30" fill="black"/>
        <rect x="39" y="5" width="2" height="30" fill="black"/>
        <rect x="43" y="5" width="3" height="30" fill="black"/>
        <rect x="48" y="5" width="1" height="30" fill="black"/>
        <rect x="51" y="5" width="2" height="30" fill="black"/>
        <rect x="55" y="5" width="1" height="30" fill="black"/>
        <rect x="58" y="5" width="3" height="30" fill="black"/>
        <rect x="63" y="5" width="2" height="30" fill="black"/>
        <rect x="67" y="5" width="1" height="30" fill="black"/>
        <rect x="70" y="5" width="2" height="30" fill="black"/>
        <rect x="74" y="5" width="3" height="30" fill="black"/>
        <rect x="79" y="5" width="1" height="30" fill="black"/>
        <rect x="82" y="5" width="2" height="30" fill="black"/>
        <rect x="86" y="5" width="1" height="30" fill="black"/>
        <rect x="89" y="5" width="3" height="30" fill="black"/>
        <rect x="94" y="5" width="2" height="30" fill="black"/>
        <rect x="98" y="5" width="1" height="30" fill="black"/>
        <rect x="101" y="5" width="2" height="30" fill="black"/>
        <rect x="105" y="5" width="3" height="30" fill="black"/>
        <rect x="110" y="5" width="1" height="30" fill="black"/>
        <rect x="113" y="5" width="2" height="30" fill="black"/>
        <rect x="117" y="5" width="1" height="30" fill="black"/>
        <rect x="120" y="5" width="3" height="30" fill="black"/>
        <rect x="125" y="5" width="2" height="30" fill="black"/>
        <rect x="129" y="5" width="1" height="30" fill="black"/>
        <rect x="132" y="5" width="2" height="30" fill="black"/>
        <rect x="136" y="5" width="3" height="30" fill="black"/>
        <rect x="141" y="5" width="1" height="30" fill="black"/>
        <rect x="144" y="5" width="2" height="30" fill="black"/>
        <rect x="148" y="5" width="1" height="30" fill="black"/>
        <rect x="151" y="5" width="3" height="30" fill="black"/>
        <rect x="156" y="5" width="2" height="30" fill="black"/>
        <rect x="160" y="5" width="1" height="30" fill="black"/>
        <rect x="163" y="5" width="2" height="30" fill="black"/>
        <rect x="167" y="5" width="3" height="30" fill="black"/>
        <rect x="172" y="5" width="1" height="30" fill="black"/>
        <rect x="175" y="5" width="2" height="30" fill="black"/>
        <rect x="179" y="5" width="1" height="30" fill="black"/>
        <rect x="182" y="5" width="3" height="30" fill="black"/>
        <rect x="187" y="5" width="2" height="30" fill="black"/>
        <rect x="191" y="5" width="1" height="30" fill="black"/>
        <rect x="194" y="5" width="2" height="30" fill="black"/>
      </svg>
      <div class="barcode-text">${barcodeValue}</div>
    </div>
  `;
}

/**
 * Generate HTML for thermal receipt printer
 * Optimized for 80mm thermal printers
 */
export function generateThermalReceipt(data: ReceiptData): string {
  const {
    invoiceId,
    storeName = 'CT EXPRESS',
    storeAddress = '8542 Westminster Blvd, Westminster CA 92683',
    storePhone = '(714) 295-6789',
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
      font-size: 10px;
      line-height: 1.3;
      width: 72mm;
      max-width: 72mm;
      margin: 0 auto;
      padding: 4mm 2mm;
      color: #000;
      background: #fff;
    }
    
    .header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 2px dashed #000;
      padding-bottom: 6px;
    }
    
    .store-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 4px;
      letter-spacing: 1px;
    }
    
    .store-info {
      font-size: 9px;
      margin: 2px 0;
      line-height: 1.3;
    }
    
    .receipt-info {
      margin: 8px 0;
      font-size: 9px;
    }
    
    .receipt-info div {
      margin: 2px 0;
    }
    
    .barcode-container {
      text-align: center;
      margin: 10px 0;
      padding: 8px 0;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
    }
    
    .barcode-svg {
      width: 60mm;
      height: 15mm;
      display: block;
      margin: 0 auto 4px auto;
    }
    
    .barcode-text {
      font-size: 8px;
      font-family: 'Courier New', monospace;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    
    .items-table {
      width: 100%;
      margin: 8px 0;
      border-collapse: collapse;
    }
    
    .items-table th {
      text-align: left;
      border-bottom: 1px solid #000;
      padding: 3px 0;
      font-size: 9px;
    }
    
    .items-table td {
      padding: 3px 0;
      font-size: 9px;
      vertical-align: top;
    }
    
    .item-name {
      width: 52%;
      font-weight: bold;
      word-wrap: break-word;
      padding-right: 4px;
    }
    
    .item-qty {
      width: 15%;
      text-align: center;
      padding: 0 2px;
    }
    
    .item-price {
      width: 33%;
      text-align: right;
      padding-left: 4px;
    }
    
    .totals {
      margin-top: 10px;
      border-top: 1px solid #000;
      padding-top: 6px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      font-size: 10px;
    }
    
    .totals-row .label {
      flex: 0 0 auto;
    }
    
    .totals-row .value {
      flex: 0 0 auto;
      text-align: right;
      min-width: 65px;
      padding-left: 8px;
    }
    
    .totals-row.total {
      font-size: 15px;
      font-weight: bold;
      border-top: 2px solid #000;
      padding-top: 5px;
      margin-top: 5px;
    }
    
    .payment-info {
      margin: 10px 0;
      padding: 6px 0;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
    }
    
    .footer {
      text-align: center;
      margin-top: 12px;
      font-size: 9px;
    }
    
    .thank-you {
      font-size: 13px;
      font-weight: bold;
      margin: 6px 0;
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

  ${generateBarcodeHTML(invoiceId)}

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
      <span class="label">Subtotal:</span>
      <span class="value">$${subtotal.toFixed(2)}</span>
    </div>
`;

  if (discount > 0) {
    html += `
    <div class="totals-row">
      <span class="label">Discount:</span>
      <span class="value">-$${discount.toFixed(2)}</span>
    </div>
`;
  }

  if (tax > 0) {
    html += `
    <div class="totals-row">
      <span class="label">Tax:</span>
      <span class="value">$${tax.toFixed(2)}</span>
    </div>
`;
  }

  html += `
    <div class="totals-row total">
      <span class="label">TOTAL:</span>
      <span class="value">$${total.toFixed(2)}</span>
    </div>
  </div>

  <div class="payment-info">
    <div class="totals-row">
      <span class="label">Payment Method:</span>
      <span class="value">${paymentMethod.toUpperCase()}</span>
    </div>
`;

  if (tenderedAmount !== undefined && paymentMethod.toLowerCase() === 'cash') {
    html += `
    <div class="totals-row">
      <span class="label">Cash Tendered:</span>
      <span class="value">$${tenderedAmount.toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span class="label">Change:</span>
      <span class="value">$${(changeGiven || 0).toFixed(2)}</span>
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
      const printWindow = window.open('', '_blank', 'width=320,height=600,menubar=no,toolbar=no,location=no');
      
      if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site to print receipts.');
        reject(new Error('Failed to open print window. Please allow pop-ups.'));
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
            
            // Close the window after printing (with a small delay)
            setTimeout(() => {
              printWindow.close();
              resolve();
            }, 500);
          } catch (error) {
            console.error('Print error:', error);
            printWindow.close();
            reject(error);
          }
        }, 250);
      };

      // Handle print dialog cancel/complete
      printWindow.onafterprint = () => {
        setTimeout(() => {
          printWindow.close();
          resolve();
        }, 100);
      };

      // Fallback: If onload doesn't fire, print anyway after 2 seconds
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (error) {
            console.error('Fallback print error:', error);
          }
        }
      }, 2000);
    } catch (error) {
      console.error('Print setup error:', error);
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
