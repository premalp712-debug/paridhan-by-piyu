import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';

const COOKIE_NAME='paridhan_admin_session';
const SESSION_SECONDS=60*60*12;
const encoder=new TextEncoder();

type SessionPayload={email:string;exp:number};

function runtime(){return env as any}

function base64UrlEncode(data:Uint8Array|string){
  const bytes=typeof data==='string'?encoder.encode(data):data;
  let binary='';
  for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function base64UrlDecode(value:string){
  const base=value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=');
  const binary=atob(base);
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
}

function toHex(bytes:Uint8Array){return [...bytes].map(v=>v.toString(16).padStart(2,'0')).join('')}
function fromHex(value:string){if(!/^[a-f0-9]+$/i.test(value)||value.length%2)return new Uint8Array();return Uint8Array.from(value.match(/.{2}/g)!.map(v=>parseInt(v,16)))}
function safeEqual(a:Uint8Array,b:Uint8Array){let diff=a.length^b.length;const length=Math.max(a.length,b.length);for(let i=0;i<length;i++)diff|=(a[i]||0)^(b[i]||0);return diff===0}

async function hmac(value:string){
  const secret=String(runtime().SESSION_SECRET||'');
  if(secret.length<32)throw new Error('Admin login is not configured. SESSION_SECRET must be at least 32 characters.');
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(value)));
}

export function ownerEmail(){return String(runtime().OWNER_EMAIL||'').trim().toLowerCase()}

export function assertAdminConfig(){
  if(!ownerEmail()||String(runtime().ADMIN_PASSWORD||'').length<10||String(runtime().SESSION_SECRET||'').length<32){
    throw new Error('Admin login is not configured. Add OWNER_EMAIL, ADMIN_PASSWORD (10+ characters) and SESSION_SECRET (32+ characters).');
  }
}

export async function verifyOwnerPassword(password:string){
  assertAdminConfig();
  const expected=await crypto.subtle.digest('SHA-256',encoder.encode(String(runtime().ADMIN_PASSWORD)));
  const supplied=await crypto.subtle.digest('SHA-256',encoder.encode(password));
  return safeEqual(new Uint8Array(expected),new Uint8Array(supplied));
}

export async function hashStaffPassword(password:string){
  if(password.length<10)throw new Error('Staff password must contain at least 10 characters.');
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const iterations=120000;
  const derived=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256));
  return `pbkdf2$${iterations}$${toHex(salt)}$${toHex(derived)}`;
}

export async function verifyStaffPassword(password:string,stored:string|null){
  const [kind,rounds,saltHex,hashHex]=String(stored||'').split('$');
  const iterations=Number(rounds);
  if(kind!=='pbkdf2'||!Number.isInteger(iterations)||iterations<100000)return false;
  const salt=fromHex(saltHex),expected=fromHex(hashHex);
  if(!salt.length||!expected.length)return false;
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const derived=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,expected.length*8));
  return safeEqual(derived,expected);
}

export async function createSessionToken(email:string){
  const payload=base64UrlEncode(JSON.stringify({email:email.toLowerCase(),exp:Math.floor(Date.now()/1000)+SESSION_SECONDS} satisfies SessionPayload));
  return `${payload}.${base64UrlEncode(await hmac(payload))}`;
}

export async function currentSession(){
  const requestHeaders=await headers();
  const cookie=requestHeaders.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE_NAME+'='))?.slice(COOKIE_NAME.length+1);
  if(!cookie)return null;
  const [payload,signature]=cookie.split('.');
  if(!payload||!signature||!safeEqual(await hmac(payload),base64UrlDecode(signature)))return null;
  try{
    const value=JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as SessionPayload;
    return value.exp>Math.floor(Date.now()/1000)&&typeof value.email==='string'?value:null;
  }catch{return null}
}

export function sessionCookie(token:string,secure:boolean){return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure?'; Secure':''}`}
export function clearSessionCookie(secure:boolean){return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure?'; Secure':''}`}
