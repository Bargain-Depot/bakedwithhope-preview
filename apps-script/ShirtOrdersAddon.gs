/*
 * Baked with Hope — shirts ordered ahead of arrival.
 * Add this as ShirtOrdersAddon.gs to the existing spreadsheet-bound Apps Script project.
 * Add this near the top of doPost(), immediately after JSON.parse:
 *   if (data.action === "submitShirtOrder") {
 *     return jsonResponse_(submitShirtOrder_(data));
 *   }
 * Run setupShirtOrders() once, then redeploy the existing web app.
 * Separate sheet: these advance-arrival shirt orders do NOT consume dessert capacity.
 */
const BWH_SHIRT_HEADERS = [
 "Submitted","Order Number","Name","Email","Phone","Designs and Sizes",
 "Shirts","Total","Payment Method","Payment Instructions",
 "Arrival / Pickup Status","Payment Status","Customer Notes"
];
const BWH_SHIRT_VARIANTS = [
 "Black shirt + Pink writing","Black shirt + White writing",
 "White shirt + Pink writing","White shirt + Black writing"
];
const BWH_SHIRT_SIZES = ["XS","Small","Medium","Large","XL"];

function getBwhShirtSheet_() {
 const book=SpreadsheetApp.getActiveSpreadsheet();
 if(!book)throw new Error("Shirt order addon must be added to the spreadsheet-bound Apps Script project.");
 let sheet=book.getSheetByName("Shirt Orders");
 if(!sheet)sheet=book.insertSheet("Shirt Orders");
 if(sheet.getLastRow()===0){
  sheet.getRange(1,1,1,BWH_SHIRT_HEADERS.length).setValues([BWH_SHIRT_HEADERS]).setFontWeight("bold");
  sheet.setFrozenRows(1);
 }
 return sheet;
}
function setupShirtOrders() {
 getBwhShirtSheet_();
 Logger.log("Shirt Orders sheet is ready. Publish a new version of the web app.");
}
function bwhShirtText_(value,max) {
 const str=String(value==null?"":value).replace(/[\u0000-\u001F]/g," ").trim().slice(0,max);
 return /^[=+\-@]/.test(str)?"'"+str:str;
}
function submitShirtOrder_(data) {
 if(!data||data.policyAccepted!==true)throw new Error("Please accept the order policy.");
 const name=bwhShirtText_(data.name,100),email=String(data.email||"").trim().slice(0,254);
 const phone=bwhShirtText_(data.phone,40),notes=bwhShirtText_(data.notes,500);
 if(!name||!phone||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("Enter your name, phone number and valid email.");
 const items=data.shirts;
 if(!Array.isArray(items)||!items.length||items.length>20)throw new Error("Choose at least one valid shirt.");
 let qty=0;
 const designs=items.map(item=>{
  const variant=String(item.variant||"").trim(),size=String(item.size||"").trim(),n=Number(item.quantity);
  if(!BWH_SHIRT_VARIANTS.includes(variant)||!BWH_SHIRT_SIZES.includes(size)||!Number.isInteger(n)||n<1||n>50)throw new Error("One of the shirt designs, sizes or quantities is invalid.");
  qty+=n;
  return n+" × "+variant+" — "+size;
 });
 if(qty>100)throw new Error("Please contact the bakery for a bulk shirt order.");
 const total=qty*25;
 if(!Number.isFinite(Number(data.total))||Math.abs(Number(data.total)-total)>.001)throw new Error("Shirt pricing changed. Refresh the shop and try again.");
 const payment=String(data.payment||"").trim();
 if(!["Venmo","Cash App","Zelle","Cash (50% deposit via Venmo)","Cash (50% deposit via Cash App)","Cash (50% deposit via Zelle)"].includes(payment))throw new Error("Select a valid payment method or cash deposit option.");
 const props=PropertiesService.getScriptProperties();
 const guard="BWH_SHIRT_ORDER_GUARD_"+hashShort_(email.toLowerCase());
 if(Date.now()-Number(props.getProperty(guard)||0)<2*60*1000)throw new Error("An order was recently received from this email. Contact Tina if you need to change it.");
 const number="BWH-SH-"+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),"yyMMdd")+"-"+Utilities.getUuid().slice(0,8).toUpperCase();
 const paymentText=bwhPaymentInstructions_({payment:payment,total:total});
 const details=designs.join("\n");
 getBwhShirtSheet_().appendRow([
  new Date(),number,name,bwhShirtText_(email,254),phone,details,qty,total,payment,paymentText,
  "Awaiting arrival","UNPAID",notes
 ]);
 props.setProperty(guard,String(Date.now()));
 const info=[
  "BAKED WITH HOPE — T-SHIRT ORDER", "Order: "+number,
  "Customer: "+name, "Email: "+email, "Phone: "+phone,
  "", "Shirts:\n"+details,"","Quantity: "+qty,
  "Total: $"+total.toFixed(2),"Payment: "+payment,
  "Payment instructions:\n"+paymentText,"",
  "PICKUP: The shirts have not arrived yet. Tina will contact the customer when they arrive to arrange pickup.",
  "Notes: "+notes
 ].join("\n");
 try{MailApp.sendEmail({to:CONFIG.OWNER_EMAIL,subject:"New T-shirt order — "+number,body:info,name:"Baked with Hope"});}
 catch(err){console.log("Shirt order owner email failed: "+err.message);}
 const customerInfo=[
  "Thank you for ordering a Baked with Hope T-shirt!",
  "", "Order Number: "+number, "Items:\n"+details,
  "Total: $"+total.toFixed(2),"Payment: "+payment,
  "", "PICKUP AFTER ARRIVAL",
  "You do not need to select a pickup date now. Tina will contact you when your shirts arrive to arrange pickup.",
  "", "HOW TO PAY",paymentText,
  "Payment (or the required cash deposit) is due within 24 hours of submitting your order, or the order may be cancelled.",
  "", "Thank you for supporting Baked with Hope and immigrant families. ♡"
 ].join("\n");
 try{MailApp.sendEmail({to:email,subject:"Your Baked with Hope T-shirt order — "+number,body:customerInfo,name:"Baked with Hope",replyTo:CONFIG.OWNER_EMAIL});}
 catch(err){console.log("Shirt order confirmation email failed: "+err.message);}
 return {ok:true,orderNumber:number,total:total,shirts:qty};
}
function getAdminShirtOrders(sessionToken){
 requireAdminSession_(sessionToken);
 const sheet=getBwhShirtSheet_();
 if(sheet.getLastRow()<2)return [];
 const start=Math.max(2,sheet.getLastRow()-149);
 const rows=sheet.getRange(start,1,sheet.getLastRow()-start+1,BWH_SHIRT_HEADERS.length).getValues();
 return rows.map((r,i)=>({
  row:start+i,submitted:r[0] instanceof Date?Utilities.formatDate(r[0],Session.getScriptTimeZone(),"MMM d, yyyy h:mm a"):"",
  number:String(r[1]),name:String(r[2]),email:String(r[3]),phone:String(r[4]),
  designs:String(r[5]),quantity:Number(r[6]||0),total:Number(r[7]||0),
  method:String(r[8]),pickupStatus:String(r[10]||"Awaiting arrival"),
  payment:String(r[11]||"UNPAID"),notes:String(r[12]||"")
 })).reverse();
}
function adminUpdateShirtOrder(sessionToken,rowNumber,newPickupStatus,newPaymentStatus){
 requireAdminSession_(sessionToken);
 const row=Number(rowNumber),sheet=getBwhShirtSheet_();
 if(!Number.isInteger(row)||row<2||row>sheet.getLastRow())throw new Error("Could not find that T-shirt order.");
 const allowed=["Awaiting arrival","Arrived — contact customer","Pickup arranged","Picked up","Cancelled"];
 if(!allowed.includes(newPickupStatus)||!["PAID","UNPAID"].includes(newPaymentStatus))throw new Error("Invalid shirt order status.");
 sheet.getRange(row,11,1,2).setValues([[newPickupStatus,newPaymentStatus]]);
 return {ok:true};
}
