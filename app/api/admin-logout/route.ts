import {clearSessionCookie} from '../../../lib/admin-auth';
import {sameOrigin} from '../../../lib/server';

export async function POST(req:Request){
  try{
    sameOrigin(req);
    return new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':clearSessionCookie(new URL(req.url).protocol==='https:')}});
  }catch{return Response.json({error:'Unable to sign out.'},{status:400})}
}
