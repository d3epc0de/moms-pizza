require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const escpos = require('escpos');
// Instalar escpos-usb adapter
escpos.USB = require('escpos-usb');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PRINTER_VID = process.env.PRINTER_VID;
const PRINTER_PID = process.env.PRINTER_PID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Faltan credenciales de Supabase en el archivo .env");
    process.exit(1);
}

// Inicializamos el cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Inicializar la Impresora USB leyendo el VendorId (VID) y ProductId (PID) desde .env
let device;
try {
    if (PRINTER_VID && PRINTER_PID) {
        console.log(`[Impresora] Conectando al dispositivo USB con VID: ${PRINTER_VID} y PID: ${PRINTER_PID}`);
        device = new escpos.USB(parseInt(PRINTER_VID, 16), parseInt(PRINTER_PID, 16));
    } else {
        console.log(`[Impresora] No se especificó VID/PID en .env. Intentando autodetectar la primera impresora USB...`);
        device = new escpos.USB();
    }
} catch (error) {
    console.error("[Error] No se encontró ninguna impresora conectada por USB.", error.message);
    // Para entornos de desarrollo sin impresora, podemos seguir escuchando la DB.
    // Solo fallará al intentar imprimir.
}

const printer = device ? new escpos.Printer(device) : null;

async function printJob(job) {
    const { id, job_type, payload } = job;
    
    if (!device || !printer) {
        console.error(`[Aviso] Ignorando trabajo ${id} porque no hay impresora configurada.`);
        await updateJobStatus(id, 'failed', 'No printer connected');
        return;
    }

    device.open(async function(error){
        if (error) {
            console.error(`[Error] No se pudo conectar a la impresora (Job ${id}):`, error);
            await updateJobStatus(id, 'failed', error.message);
            return;
        }

        try {
            printer.font('a').align('ct').style('b');
            
            if (job_type === 'kitchen_ticket') {
                // TICKET KDS (COCINA)
                printer
                    .size(2, 2).text('TICKET COCINA')
                    .size(1, 1).text(`Mesa: ${payload.table_number} | Mesero: ${payload.waiter_name}`)
                    .text('--------------------------------');
                
                payload.items.forEach(item => {
                    printer.align('lt').style('b').text(`${item.quantity}x ${item.name}`);
                    
                    if (item.modifiers && item.modifiers.length > 0) {
                        item.modifiers.forEach(mod => {
                            // Imprimir modificadores en negrita y tabulados
                            printer.style('b').text(`   + ${mod.name}`); 
                        });
                    }
                    if (item.notes) {
                        printer.style('normal').text(`   Nota: ${item.notes}`);
                    }
                });
                
                printer.feed(2); // Alimentar papel adicional para cortar fácil
                
            } else if (job_type === 'customer_receipt') {
                // RECIBO DEL CLIENTE (CAJA)
                // Use business config from payload or defaults
                const businessName = payload.business_name || "Mom's Pizza";
                const taxRate = payload.tax_rate !== undefined ? payload.tax_rate : 8; // 8% impoconsumo Colombia
                const receiptFooter = payload.receipt_footer || '¡Gracias por visitarnos!';
                const orderDate = payload.order_date || new Date().toLocaleString();
                
                printer
                    .size(2, 2).text(businessName)
                    .size(1, 1).style('normal').text('Recibo de Consumo')
                    .text(`${payload.service_type === 'to_go' ? 'Para Llevar' : 'Mesa'}: ${payload.table_number}`)
                    .text(`Orden: #${(payload.order_number || '').toString().padStart(3, '0')}`)
                    .text(`Fecha: ${orderDate}`)
                    .text(`Mesero: ${payload.waiter_name || ''}`)
                    .text('--------------------------------');
                
                let subtotal = 0;
                printer.align('lt');
                
                payload.items.forEach(item => {
                    const itemTotal = item.quantity * item.unit_price;
                    subtotal += itemTotal;
                    printer.text(`${item.quantity}x ${item.name} ... $${itemTotal.toFixed(2)}`);
                    
                    if (item.modifiers) {
                        item.modifiers.forEach(mod => {
                            if (mod.price > 0) {
                                subtotal += mod.price * item.quantity;
                                printer.text(`   + ${mod.name} ... $${(mod.price * item.quantity).toFixed(2)}`);
                            }
                        });
                    }
                });
                
                // Configurable tax rate (0 = tax included in price)
                const tax = taxRate > 0 ? subtotal * (taxRate / 100) : 0;
                const total = subtotal + tax;

                printer.text('--------------------------------')
                       .align('rt')
                       .style('normal').text(`Subtotal: $${subtotal.toFixed(2)}`);
                
                if (taxRate > 0) {
                    printer.text(`Impuesto (${taxRate}%): $${tax.toFixed(2)}`);
                }
                
                printer.style('b').size(1, 1).text(`TOTAL: $${total.toFixed(2)}`)
                       .text(`Método de Pago: ${payload.payment_method || 'Efectivo'}`)
                       .style('normal').text('--------------------------------')
                       .align('ct').text(receiptFooter)
                       .feed(2);
            }

            printer.cut().close();
            console.log(`[Éxito] Trabajo ${id} completado.`);
            await updateJobStatus(id, 'printed');
            
        } catch (err) {
            console.error(`[Error] Falló el proceso de impresión (Job ${id}):`, err);
            await updateJobStatus(id, 'failed', err.message);
        }
    });
}

async function updateJobStatus(jobId, status, errorMsg = null) {
    try {
        await supabase
            .from('print_jobs')
            .update({ 
                status: status, 
                printed_at: status === 'printed' ? new Date().toISOString() : null,
                error_message: errorMsg 
            })
            .eq('id', jobId);
    } catch(e) {
         console.error(`[Error] Update a Supabase falló para trabajo ${jobId}:`, e.message);
    }
}

function startDaemon() {
    console.log("Iniciando Print Daemon... escuchando cola de impresión en Supabase");
    
    // Configuración de Supabase Realtime
    supabase
        .channel('public:print_jobs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'print_jobs' }, payload => {
            const newJob = payload.new;
            if (newJob.status === 'pending') {
                console.log(`\n[Nuevo Trabajo] ID: ${newJob.id} | Tipo: ${newJob.job_type}`);
                printJob(newJob);
            }
        })
        .subscribe((status) => {
            if(status === 'SUBSCRIBED') {
                console.log("Conectado exitosamente a eventos de base de datos.");
            }
        });
}

startDaemon();
