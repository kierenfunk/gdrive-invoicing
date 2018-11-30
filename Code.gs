var invoiceTemplateID = 'THE_TEMPLATE_ID';
var invoiceInfoID = "THE_INVOICE_INFORMATION_ID";
var invoicesFolder = "THE_INVOICES_FOLDER_ID";
var timecampAPIKey = "YOUR_TIMECAMP_API_KEY";

function main(){
  
  // load the invoice template
  var template = DriveApp.getFileById(invoiceTemplateID);
  // Get the list of all contacts from the spreadsheet
  var spreadsheet = SpreadsheetApp.openById(invoiceInfoID);
  // Get the contacts sheet.
  var sheet = spreadsheet.getSheetByName("Contacts");
  // Get invoicing information
  var info = spreadsheet.getSheetByName("Info");
  // Get all the contact information
  var contacts = sheet.getRange("A1:H").getValues(); 
  // get the time entries from timecamp
  var entries = getTimeEntries(timecampAPIKey);
  // get extra line items
  var sheetLineItems = spreadsheet.getSheetByName("Items");
  var lineItems = sheetLineItems.getRange("A2:D").getValues();
  // group the lineItems with the time entries list
  entries = addLineItems(lineItems,entries);
  
  for(var client in entries){
    /**** for each client with a time entry ****/
    // find the client's contact details
    var contact = getContactDetails(client,contacts);
    
    if(contact){
      // if the contact exists, continue
      
      // get the current invoice number
      var invNumber = getInvoiceNumber(info);
      // create a new invoice from the template
      var newInvoice = template.makeCopy("Invoice-"+invNumber);
      // create a new document
      var doc = DocumentApp.openById(newInvoice.getId());
      var body = doc.getBody();
      // update contact details on the invoice
      updateContactDetails(body,contact);
      // update invoice number and dates
      updateInvoiceDetails(body,invNumber,contact);
      
      // add lines to the invoice
      // find the table containing invoice lines
      var table = body.getTables()[5];
      
      // get lineItems in final format
      var lines = convertEntries(entries[client],contact,5);
      
      // add line items to invoice
      updateLineItems(table,lines,contact);
      
      // save document and reopen
      doc.saveAndClose();
      var doc = DocumentApp.openById(newInvoice.getId());
      
      // convert invoice to a pdf file
      var pdf = doc.getAs('application/pdf');
      pdf.setName("Invoice-"+invNumber);
      // create a new pdf file
      var parentFolder = DriveApp.getFolderById(invoicesFolder);
      var newPdf = parentFolder.createFile(pdf);
      
      // delete the google docs template file
      newInvoice.setTrashed(true);
      
      // increment the invoice number
      setInvoiceNumber(info);
      
      // delete the line items in the spreadsheet
      deleteSheetLineItems(spreadsheet,client);
      
      // email message
      var yourName = "Kieren Funk";
      var message = "Please find attached, invoice "+invNumber+".\n\n"+
                       "If you have any questions, please don't hesitate to ask me.\n\n"+
                       "Regards,\n"+yourName;
      
      
      // create a new email
      var draft = GmailApp.createDraft(contact[3], 'Invoice '+invNumber,
                       message, {
                       attachments: [newPdf.getAs(MimeType.PDF)],
        name: yourName});
    //draft.send();
    }
  }
}
