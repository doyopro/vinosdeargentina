/* Generador de PDF para facturas (FS / FC) de VinoArgentino.es.
   Se usa desde el admin (navegador, con jsPDF) y se prueba en Node.
   Los datos salen SIEMPRE de la fila del pedido guardada en la base de datos,
   así el PDF se puede volver a generar idéntico en cualquier momento. */
(function (root) {
  var SELLER = {
    name: 'Nicolás Aldo Civatti',
    nif: 'X9258142K',
    address: 'Goleta 5, San Bartolomé, 35509, Las Palmas',
    email: 'nicolas.doyopro@gmail.com'
  };
  var PAY = { cash: 'Efectivo', transfer: 'Transferencia', stripe: 'Tarjeta (Stripe)', other: 'Otro' };

  function money(n) {
    var s = (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts[0] + ',' + parts[1] + ' €';
  }
  function price(n) { // precio unitario: 2 decimales, hasta 4 si hacen falta
    var v = Number(n) || 0;
    var s = v.toFixed(4).replace(/0+$/, '');
    var dec = (s.split('.')[1] || '').length;
    if (dec < 2) s = v.toFixed(2);
    var p = s.split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return p[0] + ',' + p[1] + ' €';
  }
  function longDate(iso) {
    var d = iso ? new Date(iso) : new Date();
    try { return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Atlantic/Canary' }).format(d); }
    catch (e) { return d.toISOString().slice(0, 10); }
  }

  function build(jsPDF, order, opts) {
    opts = opts || {};
    var seller = Object.assign({}, SELLER, opts.seller || {});
    var isFS = order.invoice_type !== 'FC';
    var doc = new jsPDF({ unit: 'mm', format: 'a4' });
    var W = 210, L = 20, R = 190;
    var ink = [15, 42, 68], muted = [110, 125, 140], line = [200, 205, 212], accent = [74, 130, 190];

    function setC(c) { doc.setTextColor(c[0], c[1], c[2]); }

    // Cabecera: logo + fecha + título
    if (opts.logoDataUrl) {
      var lw = 62, lh = lw * (opts.logoRatio || 0.27);
      doc.addImage(opts.logoDataUrl, 'PNG', L, 18, lw, lh);
    } else {
      doc.setFont('times', 'bold'); doc.setFontSize(20); setC(ink); doc.text('VinoArgentino.es', L, 26);
    }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setC(muted);
    doc.text(longDate(order.invoice_issued_at || order.created_at), R, 20, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); setC(ink);
    doc.text(isFS ? 'FACTURA SIMPLIFICADA' : 'FACTURA', R, 29, { align: 'right' });
    doc.setFontSize(11);
    doc.text('N.º ' + (order.invoice_number || '—'), R, 36, { align: 'right' });
    doc.setDrawColor(line[0], line[1], line[2]); doc.setLineWidth(0.5); doc.line(L, 44, R, 44);

    // Emisor / Cliente
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); setC(accent);
    doc.text('EMISOR', L, 52);
    var showClient = !isFS || (order.customer_name && order.customer_name !== 'Consumidor final');
    if (showClient) doc.text('CLIENTE', 112, 52);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); setC(ink);
    doc.text(seller.name, L, 58);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('NIF ' + seller.nif, L, 63);
    doc.text(seller.address, L, 68);
    doc.text(seller.email, L, 73);
    if (showClient) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(order.customer_tax_name || order.customer_name || '', 112, 58);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      var y = 63;
      if (order.customer_tax_id) { doc.text(order.customer_tax_id, 112, y); y += 5; }
      if (order.customer_tax_address) {
        doc.splitTextToSize(order.customer_tax_address, 78).forEach(function (t) { doc.text(t, 112, y); y += 5; });
      }
    }
    doc.line(L, 80, R, 80);

    // Tabla
    var y = 90;
    function header(yy) {
      doc.setFillColor(243, 246, 250); doc.rect(L, yy - 5, R - L, 8, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); setC(ink);
      doc.text('Producto', L + 2, yy);
      doc.text('Cantidad', 118, yy, { align: 'right' });
      doc.text('Precio unit. (sin IGIC)', 156, yy, { align: 'right' });
      doc.text('Importe', R - 2, yy, { align: 'right' });
    }
    header(y); y += 9;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    (order.items || []).forEach(function (it) {
      var names = doc.splitTextToSize(String(it.name || ''), 78);
      var rowH = names.length * 4.6 + 3;
      if (y + rowH > 245) { doc.addPage(); y = 25; header(y); y += 9; doc.setFont('helvetica', 'normal'); doc.setFontSize(9); }
      setC(ink);
      names.forEach(function (t, i) { doc.text(t, L + 2, y + i * 4.6); });
      var qty = it.unit === 'case6' ? (it.qty + (it.qty === 1 ? ' caja x6' : ' cajas x6')) : (it.qty + (it.qty === 1 ? ' botella' : ' botellas'));
      doc.text(qty, 118, y, { align: 'right' });
      doc.text(price(it.unit_price_net), 156, y, { align: 'right' });
      doc.text(money(it.line_net), R - 2, y, { align: 'right' });
      doc.setDrawColor(230, 233, 238); doc.setLineWidth(0.2); doc.line(L, y + rowH - 3.2, R, y + rowH - 3.2);
      y += rowH;
    });

    // Totales
    if (y > 232) { doc.addPage(); y = 25; }
    y += 6;
    function row(label, value, bold) {
      doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(bold ? 11 : 9.5); setC(ink);
      doc.text(label, 120, y); doc.text(value, R - 2, y, { align: 'right' }); y += bold ? 9 : 6.5;
    }
    var disc = Number(order.valor_descuento) || 0;
    if (disc > 0) { row('Subtotal', money(order.subtotal_bruto)); row('Descuento', '-' + money(disc)); }
    row('Base imponible', money(order.base_imponible));
    row('IGIC 7%', money(order.igic_amount));
    doc.setFillColor(243, 246, 250); doc.rect(116, y - 5, R - 116, 10, 'F');
    row('TOTAL (IGIC incluido)', money(order.total_amount), true);

    // Pago y referencia
    y += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); setC(muted);
    doc.text('Método de pago: ' + (PAY[order.payment_method] || order.payment_method || '—') +
      (order.payment_status === 'pending' ? ' (pendiente de cobro)' : ''), L, y);
    if (order.id) doc.text('Pedido: ' + String(order.id).slice(0, 8).toUpperCase(), L, y + 5);

    // Pie
    doc.setDrawColor(line[0], line[1], line[2]); doc.setLineWidth(0.3); doc.line(L, 275, R, 275);
    doc.setFontSize(7.5); setC(muted);
    doc.text(isFS ? 'Factura simplificada emitida a consumidor final. Operación sujeta a IGIC al tipo del 7%, desglosado arriba.' : 'Operación sujeta a IGIC al tipo del 7%.', L, 281);
    doc.text('VinoArgentino.es - ' + seller.email, L, 286);
    return doc;
  }

  var api = { build: build, SELLER: SELLER };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.InvoicePdf = api;
})(typeof window !== 'undefined' ? window : globalThis);
