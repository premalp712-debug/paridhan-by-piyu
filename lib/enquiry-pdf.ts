import {enquiryPriceLines} from './pricing';
export async function createEnquiryPdf(e:any){
 const enc=new TextEncoder();const esc=(s:any)=>String(s??'').replace(/[^\x20-\x7e]/g,' ').replace(/([\\()])/g,'\\$1');
 let jpg:Uint8Array|null=null,w=0,h=0;
 if(e.image){const im=new Image();im.src=e.image;await im.decode();const c=document.createElement('canvas');c.width=800;c.height=Math.round(im.height/im.width*800);c.getContext('2d')!.drawImage(im,0,0,c.width,c.height);jpg=Uint8Array.from(atob(c.toDataURL('image/jpeg',.9).split(',')[1]),x=>x.charCodeAt(0));w=c.width;h=c.height;}
 const lines=['CUSTOMER DETAILS','Name: '+e.name,'WhatsApp: +91 '+e.phone,'','OUTFIT DETAILS',e.outfit||'Personal outfit','Size: Free Size',...(e.intent==='Rent'?['','RENTAL PERIOD','Pickup: '+e.start,'Return: '+e.end,'Duration: '+e.days+' days (inclusive)']:[]),'','PRICING',...enquiryPriceLines(e)];
 const wrapped=lines.flatMap(l=>l.match(/.{1,40}(?:\s|$)|.{1,40}/g)||['']);const notes=('Outfit details: '+(e.description||'To discuss with customer')+'\n\nSpecial requests: '+(e.message||'None')).split('\n').flatMap(l=>l.match(/.{1,82}(?:\s|$)|.{1,82}/g)||['']);const objs:Uint8Array[]=[];const put=(s:string)=>objs.push(enc.encode(s));put('');put('');put('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 let imageId=0;if(jpg){imageId=4;const a=enc.encode(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`),b=enc.encode('\nendstream'),out=new Uint8Array(a.length+jpg.length+b.length);out.set(a);out.set(jpg,a.length);out.set(b,a.length+jpg.length);objs.push(out);}
 const logo=new Image();logo.src='/assets/paridhan-logo.png';await logo.decode();const lc=document.createElement('canvas');lc.width=300;lc.height=300;const ctx=lc.getContext('2d')!;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,300,300);ctx.drawImage(logo,0,0,300,300);const lb=Uint8Array.from(atob(lc.toDataURL('image/jpeg',.9).split(',')[1]),x=>x.charCodeAt(0));const logoId=objs.length+1;const lh=enc.encode(`<< /Type /XObject /Subtype /Image /Width 300 /Height 300 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${lb.length} >>\nstream\n`),lt=enc.encode('\nendstream'),lo=new Uint8Array(lh.length+lb.length+lt.length);lo.set(lh);lo.set(lb,lh.length);lo.set(lt,lh.length+lb.length);objs.push(lo);
 const text=(s:any,x:number,y:number,size=10)=>`BT /F1 ${size} Tf ${x} ${y} Td (${esc(s)}) Tj ET\n`;
 const pages:number[]=[];const noteChunks=[notes.slice(0,12)];for(let i=12;i<notes.length;i+=34)noteChunks.push(notes.slice(i,i+34));
 for(let page=0;page<noteChunks.length;page++){let stream='0.99 0.98 0.96 rg 0 0 595 842 re f\n0.30 0.12 0.19 rg\n'+text('PARIDHAN BY PIYU',125,783,22)+text(e.intent.toUpperCase()+' ENQUIRY',125,759,12)+text('Priyansi Rupareliya | +91 9106815205',125,740,10)+`q 72 0 0 72 36 735 cm /Logo Do Q\n`+'0.76 0.65 0.44 RG 36 722 m 559 722 l S\n0.2 0.2 0.2 rg\n'+text('Reference: '+e.id,36,702,9)+text('Date: '+new Date(e.createdAt||Date.now()).toLocaleDateString('en-GB'),420,685,9);
 if(page===0){stream+='1 1 1 rg 36 350 523 320 re f\n0.2 0.2 0.2 rg\n';wrapped.forEach((l,i)=>stream+=text(l,52,650-i*16,l===l.toUpperCase()?11:10));if(jpg)stream+=`q ${260*w/h} 0 0 260 330 380 cm /Photo Do Q\n`;stream+='0.30 0.12 0.19 rg\n'+text('NOTES & REQUESTS',36,322,12)+'0.2 0.2 0.2 rg\n';noteChunks[page].forEach((l,i)=>stream+=text(l,36,300-i*15));}else{stream+=text('NOTES & REQUESTS - CONTINUED',36,650,12);noteChunks[page].forEach((l,i)=>stream+=text(l,36,625-i*15));}
 stream+='0.76 0.65 0.44 RG 36 78 m 559 78 l S\n0.3 0.3 0.3 rg\n'+text(e.intent==='Buy'&&e.unitPrice>0?'Purchase enquiry. Listed outfit price; payment pending.':'Enquiry only. Availability and pricing require confirmation.',36,59,9)+text('This is not a tax invoice, payment receipt or confirmed booking.',36,44,9)+text(String(page+1)+' / '+noteChunks.length,520,44,9);
 const id=objs.length+1;pages.push(id);put(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> /XObject << /Logo ${logoId} 0 R ${imageId?'/Photo '+imageId+' 0 R':''} >> >> /Contents ${id+1} 0 R >>`);put(`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}\nendstream`);}
 objs[0]=enc.encode('<< /Type /Catalog /Pages 2 0 R >>');objs[1]=enc.encode(`<< /Type /Pages /Kids [${pages.map(n=>n+' 0 R').join(' ')}] /Count ${pages.length} >>`);
 const chunks:Uint8Array[]=[enc.encode('%PDF-1.4\n')];let offset=chunks[0].length;const offsets=[0];objs.forEach((o,i)=>{offsets.push(offset);const a=enc.encode(`${i+1} 0 obj\n`),b=enc.encode('\nendobj\n');chunks.push(a,o,b);offset+=a.length+o.length+b.length});chunks.push(enc.encode(`xref\n0 ${objs.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`));
 const safeName=(e.name.replace(/[\\/:*?"<>|]/g,'').trim()||'Customer');
 return new File(chunks as BlobPart[],safeName+'-'+e.intent+'-Enquiry.pdf',{type:'application/pdf'});
}

export async function downloadEnquiry(e:any){
 const file=await createEnquiryPdf(e);const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);return file;
}

export async function shareEnquiry(e:any){
 const file=await createEnquiryPdf(e);
 const payload={files:[file],title:'Paridhan by Piyu enquiry',text:`${e.intent} enquiry for ${e.outfit||'an outfit'} · Ref ${e.id}`};
 if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share(payload);return 'shared' as const;}
 const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);return 'downloaded' as const;
}
