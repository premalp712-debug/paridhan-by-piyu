import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const products=sqliteTable('products',{id:text('id').primaryKey(),data:text('data').notNull(),stock:integer('stock').notNull(),active:integer('active').notNull().default(1)});
export const settings=sqliteTable('settings',{id:text('id').primaryKey(),data:text('data').notNull()});
export const members=sqliteTable('members',{id:text('id').primaryKey(),email:text('email').notNull().unique(),userId:text('user_id').unique(),role:text('role').notNull(),active:integer('active').notNull().default(1),createdAt:text('created_at').notNull(),passwordHash:text('password_hash')});
export const orders=sqliteTable('orders',{id:text('id').primaryKey(),requestKey:text('request_key').notNull().unique(),data:text('data').notNull(),total:integer('total').notNull(),status:text('status').notNull(),whatsapp:text('whatsapp').notNull(),demo:integer('demo').notNull(),createdAt:text('created_at').notNull()});
export const activity=sqliteTable('activity',{id:text('id').primaryKey(),actor:text('actor').notNull(),action:text('action').notNull(),createdAt:text('created_at').notNull()});
