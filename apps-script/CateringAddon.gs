/*
 * Baked with Hope — catering backend.
 *
 * Add as a NEW file named CateringAddon.gs in the SAME Apps Script project.
 * In your existing doPost, immediately after JSON.parse(e.postData.contents):
 *
 * if (data.action === "submitCateringRequest") {
 *   return jsonResponse_(submitCateringRequest_(data));
 * }
 *
 * Then run setupCateringRequests() once, save and deploy a NEW web app version.
 * This does not change the existing Orders, Availability or Settings sheets.
 */
const CATER_SHEET = "Catering Requests";
const CATER_PACKAGES = {
  "sweet-gathering":{name:"Sweet Gathering",cakes:12,bars:12,price:95,tres:6,bows:5,addon:true},
  "sweet-affair":{name:"The Sweet Affair",cakes:18,bars:18,price:140,tres:9,bows:7,addon:true},
  "party-edit":{name:"The Party Edit",cakes:24,bars:24,price:180,tres:12,bows:10,addon:true},
  "grand-celebration":{name:"The Grand Celebration",cakes:36,bars:36,price:270,tres:18,bows:15,addon:true},
  "mini-24":{name:"24 Mini Cakes",cakes:24,bars:0,price:100,tres:12,bows:10},
  "mini-36":{name:"36 Mini Cakes",cakes:36,bars:0,price:150,tres:18,bows:15},
  "mini-48":{name:"48 Mini Cakes",cakes:48,bars:0,price:195,tres:24,bows:20},
  "mini-60":{name:"60 Mini Cakes",cakes:60,bars:0,price:240,tres:30,bows:25},
  "mini-72":{name:"72 Mini Cakes",cakes:72,bars:0,price:285,tres:36,bows:30},
  "bar-24":{name:"24 Cookie Bars",cakes:0,bars:24,price:85},
  "bar-36":{name:"36 Cookie Bars",cakes:0,bars:36,price:120},
  "bar-48":{name:"48 Cookie Bars",cakes:0,bars:48,price:155},
  "bar-60":{name:"60 Cookie Bars",cakes:0,bars:60,price:185},
  "bar-72":{name:"72 Cookie Bars",cakes:0,bars:72,price:215},
  "bar-96":{name:"96 Cookie Bars",cakes:0,bars:96,price:280}
};
const CATER_CAKE_FLAVORS=["Cookies & Cream","Strawberry Crunch","Biscoff","Fruity Pebbles","Red Velvet","Salted Caramel Tres Leches","Funfetti","Banana Pudding Cake"];
const CATER_BAR_FLAVORS=["White Chocolate Raspberry","White Chocolate Biscoff","Cookies & Cream"];
const CATER_RIBBON_COLORS=["Gold Glitter","Silver Glitter","White","Light Pink","Hot Pink","Peach","Orange","Red","Burgundy","Sage Green","Royal Blue","Navy Blue","Purple","Black"];
const CATER_HEADERS=["Submitted","Request Number","Name","Email","Phone","Package","Mini Cakes","Cookie Bars","Cake Flavors","Bar Flavors","Tres Leches","8x8 Cake","Packaging","Ribbon Color","Occasion","Date Needed","Time Needed","Fulfillment","Delivery Address","Notes","Total","50% Deposit","Request Status","Payment Status"];

function setupCateringRequests() {
  getCateringSheet_();
  Logger.log("Catering sheet created. Deploy the web app after modifying doPost.");
}
function getCateringSheet_() {
  const book=SpreadsheetApp.getActiveSpreadsheet();
  if(!book)throw new Error("Catering addon must be in the existing spreadsheet's Apps Script project.");
  let sheet=book.getSheetByName(CATER_SHEET);
  if(!sheet)sheet=book.insertSheet(CATER_SHEET);
  if(sheet.getLastRow()===0){
    sheet.getRange(1,1,1,CATER_HEADERS.length).setValues([CATER_HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,CATER_HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}
function caterClean_(text,max) {
  const s=String(text==null?"":text).trim().slice(0,max||1200);
  return /^\s*[=+\-@]/.test(s)?"'"+s:s;
}
function caterFlavors_(items,allow,expected) {
  if(!Array.isArray(items)||items.length>allow.length)throw new Error("Invalid catering flavors.");
  const seen=new Set();let count=0;const lines=[];
  items.forEach(item=>{
    const name=String(item&&item.name||""),n=Number(item&&item.quantity);
    if(!allow.includes(name)||seen.has(name)||!Number.isInteger(n)||n<1||n>expected)throw new Error("Invalid cake or cookie bar quantity.");
    seen.add(name);count+=n;lines.push(n+" × "+name);
  });
  if(count!==expected)throw new Error("Your chosen flavor quantities must match the package.");
  return lines.join("; ");
}
function submitCateringRequest_(data) {
  if(!data||data.policyAccepted!==true)throw new Error("Please accept the catering requirements.");
  const p=CATER_PACKAGES[String(data.packageId||"")];
  if(!p||p.cakes+p.bars<24)throw new Error("Select a valid catering package (minimum 24 desserts).");
  const cakeFlavors=caterFlavors_(data.miniCakeFlavors||[],CATER_CAKE_FLAVORS,p.cakes);
  const barFlavors=caterFlavors_(data.cookieBarFlavors||[],CATER_BAR_FLAVORS,p.bars);
  const name=caterClean_(data.name,100),phone=caterClean_(data.phone,40),
    email=String(data.email||"").trim().slice(0,254),occasion=caterClean_(data.occasion,120);
  if(!name||!phone||!occasion||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("Enter your name, phone, valid email, and occasion.");
  const date=normalizeIsoDate_(data.eventDate);
  const today=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),"yyyy-MM-dd");
  const earliest=isoToLocalDate_(today);earliest.setDate(earliest.getDate()+10);
  if(date<formatIsoDate_(earliest))throw new Error("Catering requires at least 10 days advance notice.");
  const time=String(data.eventTime||"");
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error("Enter a valid event time.");
  const fulfillment=String(data.fulfillment||"");
  if(!["Pickup","Delivery inquiry"].includes(fulfillment))throw new Error("Choose pickup or delivery inquiry.");
  const address=caterClean_(data.deliveryAddress,240);
  if(fulfillment==="Delivery inquiry"&&!address)throw new Error("Enter a delivery address or neighborhood.");
  const tres=data.tresLeches===true,cakeAddon=data.celebrationCake===true;
  if(tres&&!p.cakes)throw new Error("This package does not include mini cakes.");
  if(cakeAddon&&!p.addon)throw new Error("8×8 add-ons are available for mixed catering packages only.");
  const cakeFlavor=cakeAddon?String(data.celebrationFlavor||""):"";
  if(cakeAddon&&!CATER_CAKE_FLAVORS.includes(cakeFlavor))throw new Error("Choose an 8×8 cake flavor.");
  const packaging=data.packaging&&typeof data.packaging==="object"?data.packaging:{},
    mode=String(packaging.mode||"standard"),boxes=mode==="box"?Number(packaging.boxCount):0,
    ribbon=mode==="standard"?"":String(packaging.ribbonColor||"");
  if(!["standard","box","individual"].includes(mode))throw new Error("Invalid packaging option.");
  if(mode==="individual"&&!p.cakes)throw new Error("Individual cake bows require a package with mini cakes.");
  if(mode==="box"&&(!Number.isInteger(boxes)||boxes<1||boxes>100))throw new Error("Choose 1–100 signature box bows.");
  if(mode!=="standard"&&!CATER_RIBBON_COLORS.includes(ribbon))throw new Error("Choose a ribbon color.");
  const total=p.price+(tres?p.tres||0:0)+(cakeAddon?30:0)+
    (mode==="box"?boxes*2:mode==="individual"?p.bows:0);
  const deposit=Math.ceil(Math.round(total*100)/2)/100;
  if(Math.abs(Number(data.total)-total)>.001||Math.abs(Number(data.deposit)-deposit)>.001){
    throw new Error("Your price changed. Please refresh the catering page.");
  }
  const props=PropertiesService.getScriptProperties(),guardKey="CATER_GUARD_"+hashShort_(email.toLowerCase());
  if(Date.now()-Number(props.getProperty(guardKey)||0)<15*60*1000){
    throw new Error("A request from this email was received recently. Contact Tina if you need to update it.");
  }
  const id="BWH-CAT-"+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),"yyMMdd")+"-"+Utilities.getUuid().split("-")[0].toUpperCase();
  const packageDesc=mode==="box"?boxes+" Signature Box Bow(s)":mode==="individual"?"Individual Cake Bows":"Standard packaging";
  getCateringSheet_().appendRow([
    new Date(),id,name,email,phone,p.name,p.cakes,p.bars,cakeFlavors,barFlavors,
    tres?"YES (+$"+p.tres+")":"NO",cakeAddon?"YES — "+cakeFlavor+" (+$30)":"NO",
    packageDesc,ribbon,occasion,date,time,fulfillment,address,caterClean_(data.notes,1200),
    total,deposit,"New inquiry","UNPAID"
  ]);
  props.setProperty(guardKey,String(Date.now()));
  const ownerBody=[
    "NEW CATERING REQUEST — "+id,"Name: "+name,"Phone: "+phone,"Email: "+email,
    "Package: "+p.name+" | "+p.cakes+" cakes + "+p.bars+" cookie bars",
    "Cakes: "+cakeFlavors,"Bars: "+barFlavors,"Tres Leches: "+(tres?"YES":"NO"),
    "8×8: "+(cakeAddon?cakeFlavor:"NO"),"Packaging: "+packageDesc+" | "+ribbon,
    "Occasion: "+occasion,"Needed: "+date+" at "+time,
    "Fulfillment: "+fulfillment+" | "+address,"Notes: "+caterClean_(data.notes,1200),
    "Estimated total: $"+total.toFixed(2),"50% deposit after approval: $"+deposit.toFixed(2),
    "Status: Inquiry only; confirm the date with the customer before collecting a deposit."
  ].join("\n");
  try{MailApp.sendEmail({to:CONFIG.OWNER_EMAIL,subject:"Catering inquiry "+id,body:ownerBody,name:"Baked with Hope"});}
  catch(err){console.log("Owner catering email error: "+err.message);}
  const customerBody=[
    "Thank you for requesting catering from Baked with Hope!","",
    "Request number: "+id,"Package: "+p.name,"Needed: "+date+" at "+time,
    "Estimated total: $"+total.toFixed(2),"50% deposit to secure: $"+deposit.toFixed(2),"",
    "This is a request, NOT a confirmed booking. Tina will review the date, details, and",
    "availability before you send the required deposit. Delivery fees, if applicable,",
    "will be confirmed separately. No payment has been collected.",
    "Thank you for supporting immigrant families through Baked with Hope. ♡"
  ].join("\n");
  try{MailApp.sendEmail({to:email,subject:"We received your catering inquiry "+id,body:customerBody,name:"Baked with Hope",replyTo:CONFIG.OWNER_EMAIL});}
  catch(err){console.log("Customer catering email error: "+err.message);}
  return {ok:true,requestNumber:id,estimatedTotal:total,deposit:deposit};
}

/* Private catering data for the owner dashboard. */
function getAdminCateringRequests(sessionToken) {
  requireAdminSession_(sessionToken);
  const sheet=getCateringSheet_();
  if(sheet.getLastRow()<2)return [];
  const first=Math.max(2,sheet.getLastRow()-49);
  return sheet.getRange(first,1,sheet.getLastRow()-first+1,24).getDisplayValues()
    .map((r,i)=>({row:first+i,number:r[1],name:r[2],email:r[3],phone:r[4],
      packageName:r[5],cakes:r[6],bars:r[7],cakeFlavors:r[8],barFlavors:r[9],
      tres:r[10],celebration:r[11],packaging:r[12],ribbon:r[13],
      occasion:r[14],eventDate:r[15],eventTime:r[16],fulfillment:r[17],
      deliveryAddress:r[18],notes:r[19],total:r[20],deposit:r[21],
      status:r[22],payment:r[23]})).reverse();
}
function adminUpdateCateringStatus(sessionToken,rowNumber,status) {
  requireAdminSession_(sessionToken);
  if(!["New inquiry","Approved","Declined","Deposit Paid","Completed"].includes(status))throw new Error("Invalid status.");
  const sheet=getCateringSheet_(),row=Number(rowNumber);
  if(!Number.isInteger(row)||row<2||row>sheet.getLastRow())throw new Error("Catering request not found.");
  sheet.getRange(row,23).setValue(status);
  if(status==="Deposit Paid")sheet.getRange(row,24).setValue("DEPOSIT PAID");
  return {ok:true};
}
