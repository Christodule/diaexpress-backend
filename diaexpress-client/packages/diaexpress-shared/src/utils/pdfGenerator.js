const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateShipmentPDF(shipment, fileName = 'recu_logichain.pdf') {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, '..', 'receipts', fileName);

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text("Reçu d'envoi LogiChain", { align: 'center' });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Date: ${new Date().toLocaleString()}`);
  doc.text(`Client: ${shipment.userEmail}`);
  doc.text(`Code de suivi: ${shipment.trackingCode}`);
  doc.text(`Produit: ${shipment.productType}`);
  doc.text(`Origine: ${shipment.origin} -> Destination: ${shipment.destination}`);
  doc.text(`Type de transport: ${shipment.deliveryType}`);
  doc.text(`Statut: ${shipment.status}`);

  doc.moveDown();
  doc.text("Merci d’avoir utilisé LogiChain. Conservez ce reçu pour votre suivi.");

  doc.end();

  return filePath;
}

module.exports = { generateShipmentPDF };
