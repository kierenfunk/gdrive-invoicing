function secondsToHours(seconds,roundedTo){
  // get amount of minutes
  var mins = Math.round(parseInt(seconds)/60);
  // round to nearest 15 minutes
  mins = Math.round(mins/roundedTo)*roundedTo;
  // return number of hours rounded to two decimal places
  return parseFloat((mins/60).toFixed(2));
}

function convertEntries(entries,contact,rounding){
  var lines = [];
  for(var i = 0; i < entries.length; i++){
    if(entries[i].hasOwnProperty('duration')){
      lines.push({
        'description':entries[i].date+"  -  "+entries[i].description,
        'quantity': secondsToHours(entries[i].duration,rounding).toFixed(2),
        'unitPrice': parseFloat(contact[7]).toFixed(2),
        'lineTotal': (secondsToHours(entries[i].duration,rounding)*parseFloat(contact[7])).toFixed(2)
      });
    }
    else{
      lines.push(entries[i]);
    }
  }
  return lines;
}

function addLineItems(lineItems,entries){
  // group the lineItems from the spreadsheet to the time entries from timecamp
  for(var i = 0; i < lineItems.length; i++){
    if(lineItems[i][0]){
      // if lineItem exists
      if(!entries.hasOwnProperty(lineItems[i][0])){
        // if lineItem contact doesn't exist, create a new property in the entries object.
        entries[lineItems[i][0]] = [];
      }
      // push the details of the lineItem
      entries[lineItems[i][0]].push({
          'description':lineItems[i][1],
          'quantity': Number(lineItems[i][2]).toFixed(2),
          'unitPrice': Number(lineItems[i][3]).toFixed(2),
          'lineTotal': (Number(lineItems[i][2])*Number(lineItems[i][3])).toFixed(2)
      });
    }
  }
  return entries;
}

function getInvoiceNumber(sheet){
  // get the info range values
  var cell = sheet.getRange("B1");
  // get the invoice number
  var num = cell.getValue().toString();
  // add zeroes to the start of the number string for presentation
  while(num.length < 4){
    num = '0'+num;
  }
  return num;
}

function deleteSheetLineItems(spreadsheet,client){
  var sheetLineItems = spreadsheet.getSheetByName("Items");
  var lineItems = sheetLineItems.getRange("A:D").getValues();
  for(var i = lineItems.length-1; i>=0; i--){
    if(lineItems[i][0] == client){
      sheetLineItems.deleteRow(i+1);
    }
  }
}

function setInvoiceNumber(sheet){
  // get the info range values
  var cell = sheet.getRange("B1");
  // get the invoice number
  var num = parseInt(cell.getValue());
  // increment
  cell.setValue(num+1);
}

function getDateString(date){
  // function for converting dates into a suitable form for the timecamp api
  
  // get dates
  var day = date.getDate().toString();
  var month = (date.getMonth()+1).toString();
  
  // add zeroes if need be
  if(month.length < 2){
    month = '0' + month;
  }
  if(day.length < 2){
    day = '0' + day;
  }
  
  return [date.getFullYear(), month, day].join('-');
}

function getTimeEntries(key){
  // Function that retrieves all entries for billable clients in the previous month
  
  // get date of the last day of last month
  var d = new Date();
  d.setDate(0);
  var toDate = getDateString(d);
  
  // get date of the first day of last month
  d.setDate(1);
  var fromDate = getDateString(d);
  
  // get entries from timecamp
  var url = "https://www.timecamp.com/third_party/api/entries/format/json/api_token/"+key+"/from/"+fromDate+"/to/"+toDate+"/";
  var params = {
      'method' : 'GET',
  };
  
  var response = UrlFetchApp.fetch(url,params);
  var jsResponse = JSON.parse(response);
  
  // group entries together into their respective client
  var grouped = grouping(jsResponse,key);
  
  // merge all entries with the same date and same description
  var collapsed = collapsing(grouped);

  return collapsed;
}

function getTasks(taskId,key){
  // function that finds the client name from a taskID
  
  // get tasks from taskID
  var url = "https://www.timecamp.com/third_party/api/tasks/format/json/api_token/"+key+"/task_id/"+String(taskId);
  var params = {
      'method' : 'GET',
  };
  var response = UrlFetchApp.fetch(url,params);
  var jsResponse = JSON.parse(response);
  
  if(jsResponse.parent_id == 0){
    // if at the top of a task hierarchy (a task with no parent), return the name
    return jsResponse.name;
  }
  return getTasks(jsResponse.parent_id,key);
}

function getContactDetails(client,contacts){
  for(var i in contacts){
    // for each contact in the contact list
    if(client === contacts[i][1]){
      // if the client name matches the contact name, return the contact
      return contacts[i];
    }
  }
  // return null otherwise
  return null;
}

function updateContactDetails(body,contact){
  body.replaceText("{Contact Name}", contact[1]);
  body.replaceText("{Contact Address}", contact[2]);
  body.replaceText("{Contact Email}", contact[3]);
  body.replaceText("{Contact Number}", contact[4]);
}

function updateInvoiceDetails(body,invNumber,contact){
  body.replaceText("{Invoice Number}", invNumber);
  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                     ];
  // get the current date
  var d = new Date();
  var date = [d.getDate(),monthNames[d.getMonth()],d.getFullYear()].join(' ');
  // get the due Date
  d.setDate(d.getDate()+parseInt(contact[5]));
  var dueDate = [d.getDate(),monthNames[d.getMonth()],d.getFullYear()].join(' ');
  // add dates to the invoice
  body.replaceText("{Invoice Date}", date);
  body.replaceText("{Due Date}", dueDate);
}

function updateLineItems(table,lines,contact){
  // get a template row from the first row
  var templateRow = table.getRow(1).copy();
  
  var subTotal = 0;
  var i = 0;
  while(i < lines.length){
    // add all entries as line items in the table
    var row;
    if(i > 0){
      row = templateRow.copy();
    }
    else{
      row = table.getRow(1);
    }
    
    row.replaceText("{Description}", lines[i].description);
    row.replaceText("{Quant}", lines[i].quantity);
    row.replaceText("{Unit Price}", lines[i].unitPrice);
    row.replaceText("{Line Total}", lines[i].lineTotal);
    subTotal += Number(lines[i].lineTotal);
    
    if(i > 0){
      // if not the first line, insert a new line
      table.insertTableRow(1+i, row);
    }
    i += 1;
  }
  
  // update sub total and grand total
  var subTotalRow = table.getRow(table.getNumRows()-2);
  subTotalRow.replaceText("{Sub Total}", Number(subTotal).toFixed(2));
  var grandTotalRow = table.getRow(table.getNumRows()-1);
  grandTotalRow.replaceText("{Grand Total}", Number(subTotal).toFixed(2));
  Logger.log(Number(subTotal).toFixed(2));
}

function collapsing(body){
  // merge all entries with the same date and same description
  
  var newBody = {};
  for(var key in body){
    // for each client
    newBody[key] = [];
    for(var key2 in body[key]){
      //for each entry in the client
      var exists = false;
      for(var i = 0; i < newBody[key].length;i++){
        // does an object exist
        if(newBody[key][i].date === body[key][key2].date && newBody[key][i].description === body[key][key2].description){
          exists = true;
          newBody[key][i].duration += body[key][key2].duration;
          break;
        }
      }
      if(!exists){
        newBody[key].push(body[key][key2]);
      }
    }
  }
  return newBody;
}

function grouping(body,key){
  // merge all time entries into their respective clients
  var newBody = {};
  for(var i in body){
    if(newBody[getTasks(body[i].task_id,key)] === undefined){
      if(body[i].billable){
        newBody[getTasks(body[i].task_id,key)] = [{
          date:body[i].date,
          description:body[i].description,
          duration:parseInt(body[i].duration)}];
      }
    }
    else{
      if(body[i].billable){
      newBody[getTasks(body[i].task_id,key)].push(
        {
          date:body[i].date,
          description:body[i].description,
          duration:parseInt(body[i].duration)
                                 });
      }
    }
  }
  return newBody;
}
