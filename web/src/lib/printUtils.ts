import { formatPrice } from "./utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CartItem } from "./store/cartStore";

export interface PrintOrder {
  orderNumber: number | string;
  customerInfo: string;
  serviceType: "here" | "to_go";
  waiterName: string;
  date: number;
  items: CartItem[];
  totalAmount?: number;
  amountReceived?: number;
  changeGiven?: number;
  paymentMethod?: string;
  discount?: number;
}

const PRINTER_STYLES = `
  @page { margin: 0; size: auto; }
  body { 
    font-family: 'Courier New', Courier, monospace; 
    margin: 0; 
    padding: 8px; 
    width: 190px; /* 58mm paper width */
    color: #000;
    font-size: 11px;
    line-height: 1.2;
    background: #fff;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .text-lg { font-size: 14px; }
  .text-xl { font-size: 18px; }
  .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
  .flex-between { display: flex; justify-content: space-between; }
  .mb-2 { margin-bottom: 6px; }
  .mt-2 { margin-top: 6px; }
  .item-row { display: flex; justify-content: space-between; margin-top: 4px; }
  .item-name { width: 70%; word-break: break-all; }
  .item-price { width: 30%; text-align: right; }
  .modifier { margin-left: 8px; font-size: 10px; }
  .notes { margin-left: 8px; font-size: 10px; font-style: italic; border: 1px solid #000; padding: 2px; display: inline-block; margin-top: 2px;}
`;

function executePrint(htmlContent: string) {
  // Temporarily disable printing per user request (no printer available)
  console.log("Printing is temporarily disabled.");
  /*
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(`
      <html>
        <head><style>${PRINTER_STYLES}</style></head>
        <body>${htmlContent}</body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  }
  */
}

export function printKitchenTicket(order: PrintOrder) {
  const formattedDate = format(new Date(order.date), "dd/MMM/yy hh:mm a", { locale: es });
  const typeText = order.serviceType === "to_go" ? "DOMICILIO" : "LOCAL";

  const itemsHtml = order.items.map(item => `
    <div class="bold text-lg" style="margin-top: 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">
      ${item.quantity}x ${item.name}
    </div>
    ${item.modifiers.map(m => `
      <div class="modifier">- ${m.name}</div>
    `).join('')}
    ${item.notes ? `
      <div class="notes">Nota: ${item.notes}</div>
    ` : ''}
  `).join('');

  const html = `
    <div class="center bold text-xl mb-2">COMANDA COCINA</div>
    <div class="center bold text-lg" style="border: 2px solid #000; padding: 4px; margin-bottom: 8px;">
      ${typeText}
    </div>
    
    <div><span class="bold">Orden:</span> #${order.orderNumber.toString().padStart(3, '0')}</div>
    <div><span class="bold">Cliente/Mesa:</span> ${order.customerInfo}</div>
    <div><span class="bold">Mesero:</span> ${order.waiterName}</div>
    <div><span class="bold">Fecha:</span> ${formattedDate}</div>
    
    <div class="divider"></div>
    
    <div class="mb-2 bold">DETALLE DEL PEDIDO:</div>
    ${itemsHtml}
    
    <div class="divider" style="margin-top: 15px;"></div>
    <div class="center mb-2">Fin de comanda</div>
  `;

  executePrint(html);
}

export function printCustomerReceipt(order: PrintOrder) {
  const formattedDate = format(new Date(order.date), "dd/MMM/yy hh:mm a", { locale: es });
  const typeText = order.serviceType === "to_go" ? "DOMICILIO" : "LOCAL";

  const paymentMethodNames: Record<string, string> = {
    'cash': 'Efectivo', 'nequi': 'Nequi', 'card': 'Tarjeta', 'transfer': 'Transferencia'
  };

  const itemsHtml = order.items.map(item => `
    <div class="item-row">
      <div class="item-name">${item.quantity}x ${item.name}</div>
      <div class="item-price">${formatPrice(item.totalPrice)}</div>
    </div>
    ${item.modifiers.map(m => `
      <div class="item-row modifier">
        <div class="item-name">- ${m.name}</div>
        <div class="item-price">${m.price && m.price > 0 ? '(+)' : ''}</div>
      </div>
    `).join('')}
  `).join('');

  const html = `
    <div class="center bold text-xl">MOM'S PIZZA</div>
    <div class="center mb-2">El mejor sabor</div>
    
    <div class="divider"></div>
    
    <div><span class="bold">Orden:</span> #${order.orderNumber.toString().padStart(3, '0')}</div>
    <div><span class="bold">Tipo:</span> ${typeText}</div>
    <div><span class="bold">Cliente/Mesa:</span> ${order.customerInfo}</div>
    <div><span class="bold">Cajero:</span> ${order.waiterName}</div>
    <div><span class="bold">Fecha:</span> ${formattedDate}</div>
    
    <div class="divider"></div>
    
    <div class="bold mb-2 flex-between">
      <span>DESCRIPCION</span>
      <span>TOTAL</span>
    </div>
    ${itemsHtml}
    
    <div class="divider"></div>
    
    ${order.discount ? `
      <div class="flex-between">
        <span>Descuento:</span>
        <span>- ${formatPrice(order.discount)}</span>
      </div>
    ` : ''}
    
    <div class="flex-between bold text-lg mt-2">
      <span>TOTAL A PAGAR:</span>
      <span>${formatPrice(order.totalAmount || 0)}</span>
    </div>
    
    <div class="divider"></div>
    
    <div class="flex-between">
      <span>Medio de pago:</span>
      <span>${paymentMethodNames[order.paymentMethod || 'cash'] || order.paymentMethod}</span>
    </div>
    <div class="flex-between">
      <span>Recibido:</span>
      <span>${formatPrice(order.amountReceived || 0)}</span>
    </div>
    <div class="flex-between">
      <span>Cambio:</span>
      <span>${formatPrice(order.changeGiven || 0)}</span>
    </div>
    
    <div class="divider" style="margin-top: 15px;"></div>
    <div class="center bold mt-2" style="font-size: 16px;">¡Gracias por su compra!</div>
  `;

  executePrint(html);
}
