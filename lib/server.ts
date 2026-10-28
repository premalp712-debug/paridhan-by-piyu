import {env} from 'cloudflare:workers';
import {currentSession,ownerEmail} from './admin-auth';
import {defaults,samples,Product} from './catalog';
export const db=()=>{const d=(env as any).DB as D1Database;if(!d)throw new Error('Database unavailable');return d};
export const bucket=()=> (env as any).BUCKET as R2Bucket;
export const runtime=()=>env as any;
let schemaPromise:Promise<void>|null=null;
export function ensureSchema(){
if(!schemaPromise)schemaPromise=(async()=>{
await db().batch([
db().prepare('CREATE TABLE IF NOT EXISTS products (id text PRIMARY KEY NOT NULL,data text NOT NULL,stock integer NOT NULL,active integer DEFAULT 1 NOT NULL)'),
db().prepare('CREATE TABLE IF NOT EXISTS settings (id text PRIMARY KEY NOT NULL,data text NOT NULL)'),
db().prepare('CREATE TABLE IF NOT EXISTS members (id text PRIMARY KEY NOT NULL,email text NOT NULL UNIQUE,user_id text UNIQUE,role text NOT NULL,active integer DEFAULT 1 NOT NULL,created_at text NOT NULL,password_hash text)'),
db().prepare('CREATE TABLE IF NOT EXISTS orders (id text PRIMARY KEY NOT NULL,request_key text NOT NULL UNIQUE,data text NOT NULL,total integer NOT NULL,status text NOT NULL,whatsapp text NOT NULL,demo integer NOT NULL,created_at text NOT NULL)'),
db().prepare('CREATE TABLE IF NOT EXISTS activity (id text PRIMARY KEY NOT NULL,actor text NOT NULL,action text NOT NULL,created_at text NOT NULL)'),
db().prepare('CREATE TABLE IF NOT EXISTS enquiries (id text PRIMARY KEY NOT NULL,data text NOT NULL,created_at text NOT NULL)')]);
const columns=await db().prepare('PRAGMA table_info(members)').all<any>();
if(!columns.results.some((column:any)=>column.name==='password_hash'))await db().prepare('ALTER TABLE members ADD COLUMN password_hash text').run();
})().catch(e=>{schemaPromise=null;throw e});
return schemaPromise;
}
async function refreshCollection(){
await ensureSchema();
const marker='collection-oct27-v2';
const done=await db().prepare('SELECT id FROM settings WHERE id=?').bind(marker).first();if(done)return;
const old=await db().prepare('SELECT data FROM settings WHERE id=?').bind('store').first<any>();
const next={...defaults,...(old?JSON.parse(old.data):{}),ownerName:defaults.ownerName,announcement:defaults.announcement,heroText:defaults.heroText,storyText:defaults.storyText,heroImage:defaults.heroImage};
await db().batch([
db().prepare("UPDATE products SET active=0 WHERE id IN ('sample-1','sample-2','sample-3','sample-4')"),
...samples.map(p=>db().prepare('INSERT OR IGNORE INTO products(id,data,stock,active) VALUES(?,?,?,1)').bind(p.id,JSON.stringify(p),p.stock)),
...samples.map(p=>db().prepare("UPDATE products SET data=json_set(data,'$.category',?) WHERE id=?").bind(p.category,p.id)),
db().prepare('INSERT OR REPLACE INTO settings(id,data) VALUES(?,?)').bind('store',JSON.stringify(next)),
db().prepare('INSERT OR IGNORE INTO settings(id,data) VALUES(?,?)').bind(marker,'{}')]);
}
export async function settings(){await refreshCollection();const r=await db().prepare('SELECT data FROM settings WHERE id=?').bind('store').first<any>();return {...defaults,...(r?JSON.parse(r.data):{})};}
export async function catalog(all=false):Promise<Product[]>{await refreshCollection();const rows=await db().prepare('SELECT * FROM products'+(all?'':' WHERE active=1')).all<any>();if(!rows.results.length){const count=await db().prepare('SELECT count(*) as n FROM products').first<any>();const s=await settings();return !count.n&&s.demoMode?samples:[]}return rows.results.map(r=>({...JSON.parse(r.data),brand:JSON.parse(r.data).brand==='Royal Atelier'?'Paridhan by Piyu':JSON.parse(r.data).brand,rentalPrice:JSON.parse(r.data).rentalPrice??null,deposit:JSON.parse(r.data).deposit??null,id:r.id,stock:r.stock,active:!!r.active}));}
export async function seed(){const s=await settings();if(!s.demoMode)return;const rows=await db().prepare('SELECT count(*) as n FROM products').first<any>();if(!rows.n)await db().batch(samples.map(p=>db().prepare('INSERT OR IGNORE INTO products(id,data,stock,active) VALUES(?,?,?,1)').bind(p.id,JSON.stringify(p),p.stock)));}
export async function identity(){await ensureSchema();const session=await currentSession();if(!session)return null;const email=session.email.toLowerCase();
if(email===ownerEmail())await db().prepare("INSERT INTO members(id,email,role,active,created_at) VALUES('owner',?,'owner',1,?) ON CONFLICT(email) DO UPDATE SET role='owner',active=1").bind(email,new Date().toISOString()).run();
const member=await db().prepare('SELECT * FROM members WHERE email=?').bind(email).first<any>();
return member?.active?{userId:'local:'+email,displayName:email.split('@')[0],email,fullName:null,role:member.role}:null;}
export const roles:any={owner:['products','orders','analytics','settings','access'],manager:['products','orders','analytics'],editor:['products','settings'],analyst:['analytics']};
export async function authorize(permission:string){const u=await identity();if(!u||!(roles[u.role]||[]).includes(permission))throw new Error('Forbidden');return u;}
export async function audit(actor:string,action:string){await ensureSchema();await db().prepare('INSERT INTO activity(id,actor,action,created_at) VALUES(?,?,?,?)').bind(crypto.randomUUID(),actor,action,new Date().toISOString()).run();}
export function sameOrigin(req:Request){if(req.headers.get('origin')!==new URL(req.url).origin)throw new Error('Forbidden');}
export function json(data:any,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export function error(e:any){return json({error:e.message==='Forbidden'?'Access denied. Please sign in with an authorized account.':e.message||'Request failed.'},e.message==='Forbidden'?403:400);}
export function validImage(v:string){return v.startsWith('/assets/')||/^\/api\/media\/[a-z0-9-]+$/.test(v)||/^https:\/\//.test(v);}
