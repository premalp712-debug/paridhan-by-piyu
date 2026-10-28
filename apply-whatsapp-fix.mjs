import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const bundle=path.dirname(fileURLToPath(import.meta.url));
const root=process.cwd();
const page=path.join(root,'app/page.tsx');
if(!fs.existsSync(page)||!fs.existsSync(path.join(root,'lib/pricing.ts'))){console.error('Run this command from your website project folder after applying the Price Update.');process.exit(1)}
let source=fs.readFileSync(page,'utf8');
if(source.includes('PARIDHAN_WHATSAPP_DIRECT_V1')){console.log('WhatsApp fix already applied. No files changed.');process.exit(0)}
const start="<form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');const f=new FormData(e.currentTarget);try{const res=await fetch('/api/enquiries'";
const end="setSavedEnquiry(d);setPanel('enquiry-ready');const result=await shareEnquiry(d);setToast(result==='shared'?'PDF shared successfully':'PDF downloaded. Attach it in WhatsApp using the paperclip.')}catch(e:any){setError(e.message)}finally{setBusy(false)}}}";
const modalStart="{panel==='enquiry-ready'?<>";
const modalEnd="</>:panel==='inquiry'?<>";
if(source.split(start).length!==2||source.split(end).length!==2||!source.includes(modalStart)||!source.includes(modalEnd)){
 console.error('Your enquiry code differs from the supplied version. No files changed. Send app/page.tsx for a matching patch.');process.exit(1);
}
source=source.replace("'use client';", "'use client';\n// PARIDHAN_WHATSAPP_DIRECT_V1\nimport {prepareWhatsAppWindow,finishWhatsAppEnquiry,enquiryWhatsAppUrl} from '../lib/whatsapp-enquiry';");
source=source.replace(start,"<form onSubmit={async e=>{e.preventDefault();if(busy)return;const whatsappWindow=prepareWhatsAppWindow();setBusy(true);setError('');const f=new FormData(e.currentTarget);try{const res=await fetch('/api/enquiries'");
source=source.replace(end,"setSavedEnquiry(d);setPanel('enquiry-ready');const result=await finishWhatsAppEnquiry(d,whatsappWindow);setToast(result.downloaded?'PDF download started. Review your message in WhatsApp and tap Send.':'Enquiry saved. You can retry the PDF download below.')}catch(e:any){if(whatsappWindow&&!whatsappWindow.closed)whatsappWindow.close();setError(e.message)}finally{setBusy(false)}}}");
const a=source.indexOf(modalStart),b=source.indexOf(modalEnd,a);
source=source.slice(0,a)+`{panel==='enquiry-ready'?<><div className="eyebrow">ENQUIRY SAVED</div><h2>Continue in WhatsApp.</h2><p>Your enquiry and price details are ready for the owner at +91 9106815205. Review the message and tap Send.</p><p className="muted">Attach the downloaded PDF using the WhatsApp paperclip if you want to include the document.</p><a className="button maroon full" href={enquiryWhatsAppUrl(savedEnquiry)} target="_blank" rel="noreferrer">CONTINUE TO WHATSAPP</a><button className="button outline full" onClick={async()=>{try{await downloadEnquiry(savedEnquiry)}catch{setError('PDF could not be created. Please retry.')}}}>DOWNLOAD PDF AGAIN</button>{error&&<p className="error">{error}</p>}`+source.slice(b);
// Fail before touching the project if helper source is missing.
const helper=fs.readFileSync(path.join(bundle,'files/lib/whatsapp-enquiry.ts'));
const backup=page+'.before-whatsapp-'+Date.now()+'.bak';
fs.copyFileSync(page,backup);
fs.writeFileSync(path.join(root,'lib/whatsapp-enquiry.ts'),helper);
fs.writeFileSync(page,source);
console.log('Applied. Existing prices, database, images and login settings were preserved.');
console.log('Backup: '+backup);
console.log('Restart npm run dev, or rebuild with npm run build before npm run start.');
