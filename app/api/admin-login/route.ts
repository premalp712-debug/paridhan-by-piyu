import {createSessionToken,ownerEmail,sessionCookie,verifyOwnerPassword,verifyStaffPassword} from '../../../lib/admin-auth';
import {db,ensureSchema,json,error,sameOrigin} from '../../../lib/server';

export async function POST(req:Request){
  try{
    sameOrigin(req);
    await ensureSchema();
    const body:any=await req.json();
    const email=String(body.email||'').trim().toLowerCase();
    const password=String(body.password||'');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!password)throw new Error('Enter your email and password.');
    let valid=false;
    if(email===ownerEmail()){
      valid=await verifyOwnerPassword(password);
      if(valid)await db().prepare("INSERT INTO members(id,email,role,active,created_at) VALUES('owner',?,'owner',1,?) ON CONFLICT(email) DO UPDATE SET role='owner',active=1").bind(email,new Date().toISOString()).run();
    }else{
      const member=await db().prepare('SELECT password_hash,active FROM members WHERE email=?').bind(email).first<any>();
      valid=!!member?.active&&await verifyStaffPassword(password,member.password_hash);
    }
    if(!valid)return json({error:'Incorrect email or password.'},401);
    const token=await createSessionToken(email);
    return new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':sessionCookie(token,new URL(req.url).protocol==='https:')}});
  }catch(e){return error(e)}
}
