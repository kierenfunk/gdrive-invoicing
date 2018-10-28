# gdrive-invoicing
A google apps script that pulls data from timecamp and creates monthly invoices

<h1>How to use:</h1>

<h3>Step 1.</h3>
Create a folder in google drive, call it 'Invoicing' or whatever you want.

<h3>Step 2.</h3>
Create a google apps script file and add Code.gs and Functions.gs to it.

<h3>Step 3.</h3>
Copy the following invoice template: <https://docs.google.com/document/d/10zXZZ5blCgTCtTRL2MiCvJgvz_bfE6Rf9dabUEijJP0/edit?usp=sharing> to your new google drive folder. <br>
Feel free to edit the basic information including the currency in the line items table, although be careful when changing the page layout or formatting, you may break the script!<br>
Get the ID of this document and update the ID in Code.gs.<br>
(to find the ID look in the url)

<h3>Step 4.</h3>
Copy the following spreadsheet: <https://docs.google.com/spreadsheets/d/10zssylAt-J5zU_ZSDB994Qr1SYv4dcukd0QT9kJsMPg/edit?usp=sharing> to your new google drive folder.<br>
Inside you may edit the sheet called 'Contacts'. Feel free to add any contacts you have in here.<br>
Get the ID of this spreadsheet and update the ID in Code.gs.<br>
(to find the ID look in the url)

<h3>Step 5.</h3>
Create a sub folder called 'Invoices' or whatever you like, this folder will hold all of your invoices.<br>
Get the ID of this folder and update the ID in Code.gs.<br>
(to find the ID look in the url)<br>

<h3>Step 6.</h3>
In Timecamp make sure you have an API key, update the API key in Code.gs.<br>
When creating tasks, make sure that the task name matches the contact name in the 'Contacts' sheet of the Invoice Information spreadsheet.<br>
Also make sure that the entity you will be creating invoices for is a parent task. AKA not a sub task.<br>
Also make sure that time entries for this task are billable by default.<br>

<h3>Step 7.</h3>
Run the main function in Code.gs and check your email drafts.

<h3>Step 8.</h3>
Set a trigger for the 'main' function in Code.gs for the first day of every month. 

<h2>Extra Important Information:</h2>
<ul>
<li>By default, this script will only create an email draft. You can send the email straight away with the script, I have commented this out to avoid sending an incorrect invoice.</li>
<li>This will only pull entries that are billable.</li>
<li>It will concatenate entries into one line item where the entries have the same description and were done on the same day.</li>
<li>The duration of time for each entry is rounded to 5 minutes by default. Although, this can be changed on line 44 in Code.gs with the fourth parameter in the function updateLineItems().</li>
</ul>

If you have questions or suggestions on how to improve this script, contact me [here](http://www.kierenfunk.com/#contact)
