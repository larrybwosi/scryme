import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'manager', 'member');
  CREATE TYPE "public"."enum_users_organizations_role" AS ENUM('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');
  CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__products_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_campaigns_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__campaigns_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_banners_placement" AS ENUM('top-bar', 'hero', 'footer', 'popup');
  CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"domain" varchar,
	"logo_url" varchar,
	"is_suspended" boolean DEFAULT false,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "users_roles" (
	"order" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"value" "enum_users_roles",
	"id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE "users_organizations" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"role" "enum_users_organizations_role" DEFAULT 'MEMBER'
  );

  CREATE TABLE "users_sessions" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp(3) with time zone,
	"expires_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"email" varchar NOT NULL,
	"reset_password_token" varchar,
	"reset_password_expiration" timestamp(3) with time zone,
	"salt" varchar,
	"hash" varchar,
	"reset_password_requested_at" timestamp(3) with time zone,
	"login_attempts" numeric DEFAULT 0,
	"lock_until" timestamp(3) with time zone
  );

  CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"alt" varchar NOT NULL,
	"caption" varchar,
	"_objectkey" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"url" varchar,
	"thumbnail_u_r_l" varchar,
	"filename" varchar,
	"mime_type" varchar,
	"filesize" numeric,
	"width" numeric,
	"height" numeric,
	"focal_x" numeric,
	"focal_y" numeric,
	"sizes_thumbnail_url" varchar,
	"sizes_thumbnail_width" numeric,
	"sizes_thumbnail_height" numeric,
	"sizes_thumbnail_mime_type" varchar,
	"sizes_thumbnail_filesize" numeric,
	"sizes_thumbnail_filename" varchar,
	"sizes_card_url" varchar,
	"sizes_card_width" numeric,
	"sizes_card_height" numeric,
	"sizes_card_mime_type" varchar,
	"sizes_card_filesize" numeric,
	"sizes_card_filename" varchar,
	"sizes_hero_url" varchar,
	"sizes_hero_width" numeric,
	"sizes_hero_height" numeric,
	"sizes_hero_mime_type" varchar,
	"sizes_hero_filesize" numeric,
	"sizes_hero_filename" varchar
  );

  CREATE TABLE "products_gallery" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_id" integer,
	"caption" varchar
  );

  CREATE TABLE "products_features" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"description" varchar,
	"icon" varchar
  );

  CREATE TABLE "products_specifications" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"value" varchar
  );

  CREATE TABLE "ft_lst" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"item" varchar
  );

  CREATE TABLE "prc_hl" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"plan_name" varchar,
	"price" varchar,
	"billing_cycle" varchar
  );

  CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"title" varchar,
	"slug" varchar,
	"tagline" varchar,
	"description" jsonb,
	"cover_image_id" integer,
	"cta_link" varchar,
	"cta_text" varchar DEFAULT 'Get Started',
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_products_status" DEFAULT 'draft'
  );

  CREATE TABLE "_products_v_version_gallery" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer,
	"caption" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_products_v_version_features" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"description" varchar,
	"icon" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_products_v_version_specifications" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"value" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_ft_lst_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"item" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_prc_hl_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"plan_name" varchar,
	"price" varchar,
	"billing_cycle" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_products_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_organization_id" integer,
	"version_title" varchar,
	"version_slug" varchar,
	"version_tagline" varchar,
	"version_description" jsonb,
	"version_cover_image_id" integer,
	"version_cta_link" varchar,
	"version_cta_text" varchar DEFAULT 'Get Started',
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__products_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"latest" boolean
  );

  CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"title" varchar,
	"slug" varchar,
	"active" boolean DEFAULT true,
	"banner_image_id" integer,
	"discount_text" varchar,
	"target_audience" varchar,
	"description" jsonb,
	"start_date" timestamp(3) with time zone,
	"end_date" timestamp(3) with time zone,
	"action_url" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_campaigns_status" DEFAULT 'draft'
  );

  CREATE TABLE "_campaigns_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_organization_id" integer,
	"version_title" varchar,
	"version_slug" varchar,
	"version_active" boolean DEFAULT true,
	"version_banner_image_id" integer,
	"version_discount_text" varchar,
	"version_target_audience" varchar,
	"version_description" jsonb,
	"version_start_date" timestamp(3) with time zone,
	"version_end_date" timestamp(3) with time zone,
	"version_action_url" varchar,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__campaigns_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"latest" boolean
  );

  CREATE TABLE "pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"title" varchar,
	"slug" varchar,
	"hero_heading" varchar,
	"hero_subheading" varchar,
	"hero_hero_image_id" integer,
	"hero_primary_cta_text" varchar,
	"hero_primary_cta_link" varchar,
	"content" jsonb,
	"seo_meta_title" varchar,
	"seo_meta_description" varchar,
	"seo_og_image_id" integer,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_pages_status" DEFAULT 'draft'
  );

  CREATE TABLE "_pages_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_organization_id" integer,
	"version_title" varchar,
	"version_slug" varchar,
	"version_hero_heading" varchar,
	"version_hero_subheading" varchar,
	"version_hero_hero_image_id" integer,
	"version_hero_primary_cta_text" varchar,
	"version_hero_primary_cta_link" varchar,
	"version_content" jsonb,
	"version_seo_meta_title" varchar,
	"version_seo_meta_description" varchar,
	"version_seo_og_image_id" integer,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"latest" boolean
  );

  CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"title" varchar NOT NULL,
	"content" varchar NOT NULL,
	"action_url" varchar,
	"action_text" varchar,
	"placement" "enum_banners_placement" DEFAULT 'top-bar',
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"customer_name" varchar NOT NULL,
	"role" varchar,
	"company" varchar,
	"avatar_id" integer,
	"quote" varchar NOT NULL,
	"rating" numeric DEFAULT 5,
	"is_featured" boolean DEFAULT false,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_kv" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar NOT NULL,
	"data" jsonb NOT NULL
  );

  CREATE TABLE "payload_locked_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"global_slug" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_locked_documents_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"tenants_id" integer,
	"users_id" integer,
	"media_id" integer,
	"products_id" integer,
	"campaigns_id" integer,
	"pages_id" integer,
	"banners_id" integer,
	"testimonials_id" integer
  );

  CREATE TABLE "payload_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"value" jsonb,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_preferences_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"users_id" integer
  );

  CREATE TABLE "payload_migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"batch" numeric,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_organizations" ADD CONSTRAINT "users_organizations_organization_id_tenants_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_organizations" ADD CONSTRAINT "users_organizations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_organization_id_tenants_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_features" ADD CONSTRAINT "products_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_specifications" ADD CONSTRAINT "products_specifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ft_lst" ADD CONSTRAINT "ft_lst_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."prc_hl"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "prc_hl" ADD CONSTRAINT "prc_hl_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_tenants_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_gallery" ADD CONSTRAINT "_products_v_version_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_gallery" ADD CONSTRAINT "_products_v_version_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_features" ADD CONSTRAINT "_products_v_version_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_specifications" ADD CONSTRAINT "_products_v_version_specifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ft_lst_v" ADD CONSTRAINT "_ft_lst_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_prc_hl_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_prc_hl_v" ADD CONSTRAINT "_prc_hl_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_organization_id_tenants_id_fk" FOREIGN KEY ("version_organization_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organization_id_tenants_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_banner_image_id_media_id_fk" FOREIGN KEY ("banner_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_campaigns_v" ADD CONSTRAINT "_campaigns_v_parent_id_campaigns_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_campaigns_v" ADD CONSTRAINT "_campaigns_v_version_organization_id_tenants_id_fk" FOREIGN KEY ("version_organization_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_campaigns_v" ADD CONSTRAINT "_campaigns_v_version_banner_image_id_media_id_fk" FOREIGN KEY ("version_banner_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_organization_id_tenants_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_organization_id_tenants_id_fk" FOREIGN KEY ("version_organization_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_hero_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "banners" ADD CONSTRAINT "banners_organization_id_tenants_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_organization_id_tenants_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_campaigns_fk" FOREIGN KEY ("campaigns_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_banners_fk" FOREIGN KEY ("banners_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");
  CREATE UNIQUE INDEX "tenants_domain_idx" ON "tenants" USING btree ("domain");
  CREATE INDEX "tenants_updated_at_idx" ON "tenants" USING btree ("updated_at");
  CREATE INDEX "tenants_created_at_idx" ON "tenants" USING btree ("created_at");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_organizations_order_idx" ON "users_organizations" USING btree ("_order");
  CREATE INDEX "users_organizations_parent_id_idx" ON "users_organizations" USING btree ("_parent_id");
  CREATE INDEX "users_organizations_organization_idx" ON "users_organizations" USING btree ("organization_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_organization_idx" ON "media" USING btree ("organization_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "products_gallery_order_idx" ON "products_gallery" USING btree ("_order");
  CREATE INDEX "products_gallery_parent_id_idx" ON "products_gallery" USING btree ("_parent_id");
  CREATE INDEX "products_gallery_image_idx" ON "products_gallery" USING btree ("image_id");
  CREATE INDEX "products_features_order_idx" ON "products_features" USING btree ("_order");
  CREATE INDEX "products_features_parent_id_idx" ON "products_features" USING btree ("_parent_id");
  CREATE INDEX "products_specifications_order_idx" ON "products_specifications" USING btree ("_order");
  CREATE INDEX "products_specifications_parent_id_idx" ON "products_specifications" USING btree ("_parent_id");
  CREATE INDEX "ft_lst_order_idx" ON "ft_lst" USING btree ("_order");
  CREATE INDEX "ft_lst_parent_id_idx" ON "ft_lst" USING btree ("_parent_id");
  CREATE INDEX "prc_hl_order_idx" ON "prc_hl" USING btree ("_order");
  CREATE INDEX "prc_hl_parent_id_idx" ON "prc_hl" USING btree ("_parent_id");
  CREATE INDEX "products_organization_idx" ON "products" USING btree ("organization_id");
  CREATE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_cover_image_idx" ON "products" USING btree ("cover_image_id");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "products__status_idx" ON "products" USING btree ("_status");
  CREATE INDEX "_products_v_version_gallery_order_idx" ON "_products_v_version_gallery" USING btree ("_order");
  CREATE INDEX "_products_v_version_gallery_parent_id_idx" ON "_products_v_version_gallery" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_gallery_image_idx" ON "_products_v_version_gallery" USING btree ("image_id");
  CREATE INDEX "_products_v_version_features_order_idx" ON "_products_v_version_features" USING btree ("_order");
  CREATE INDEX "_products_v_version_features_parent_id_idx" ON "_products_v_version_features" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_specifications_order_idx" ON "_products_v_version_specifications" USING btree ("_order");
  CREATE INDEX "_products_v_version_specifications_parent_id_idx" ON "_products_v_version_specifications" USING btree ("_parent_id");
  CREATE INDEX "_ft_lst_v_order_idx" ON "_ft_lst_v" USING btree ("_order");
  CREATE INDEX "_ft_lst_v_parent_id_idx" ON "_ft_lst_v" USING btree ("_parent_id");
  CREATE INDEX "_prc_hl_v_order_idx" ON "_prc_hl_v" USING btree ("_order");
  CREATE INDEX "_prc_hl_v_parent_id_idx" ON "_prc_hl_v" USING btree ("_parent_id");
  CREATE INDEX "_products_v_parent_idx" ON "_products_v" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_version_organization_idx" ON "_products_v" USING btree ("version_organization_id");
  CREATE INDEX "_products_v_version_version_slug_idx" ON "_products_v" USING btree ("version_slug");
  CREATE INDEX "_products_v_version_version_cover_image_idx" ON "_products_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_products_v_version_version_updated_at_idx" ON "_products_v" USING btree ("version_updated_at");
  CREATE INDEX "_products_v_version_version_created_at_idx" ON "_products_v" USING btree ("version_created_at");
  CREATE INDEX "_products_v_version_version__status_idx" ON "_products_v" USING btree ("version__status");
  CREATE INDEX "_products_v_created_at_idx" ON "_products_v" USING btree ("created_at");
  CREATE INDEX "_products_v_updated_at_idx" ON "_products_v" USING btree ("updated_at");
  CREATE INDEX "_products_v_latest_idx" ON "_products_v" USING btree ("latest");
  CREATE INDEX "campaigns_organization_idx" ON "campaigns" USING btree ("organization_id");
  CREATE INDEX "campaigns_slug_idx" ON "campaigns" USING btree ("slug");
  CREATE INDEX "campaigns_banner_image_idx" ON "campaigns" USING btree ("banner_image_id");
  CREATE INDEX "campaigns_updated_at_idx" ON "campaigns" USING btree ("updated_at");
  CREATE INDEX "campaigns_created_at_idx" ON "campaigns" USING btree ("created_at");
  CREATE INDEX "campaigns__status_idx" ON "campaigns" USING btree ("_status");
  CREATE INDEX "_campaigns_v_parent_idx" ON "_campaigns_v" USING btree ("parent_id");
  CREATE INDEX "_campaigns_v_version_version_organization_idx" ON "_campaigns_v" USING btree ("version_organization_id");
  CREATE INDEX "_campaigns_v_version_version_slug_idx" ON "_campaigns_v" USING btree ("version_slug");
  CREATE INDEX "_campaigns_v_version_version_banner_image_idx" ON "_campaigns_v" USING btree ("version_banner_image_id");
  CREATE INDEX "_campaigns_v_version_version_updated_at_idx" ON "_campaigns_v" USING btree ("version_updated_at");
  CREATE INDEX "_campaigns_v_version_version_created_at_idx" ON "_campaigns_v" USING btree ("version_created_at");
  CREATE INDEX "_campaigns_v_version_version__status_idx" ON "_campaigns_v" USING btree ("version__status");
  CREATE INDEX "_campaigns_v_created_at_idx" ON "_campaigns_v" USING btree ("created_at");
  CREATE INDEX "_campaigns_v_updated_at_idx" ON "_campaigns_v" USING btree ("updated_at");
  CREATE INDEX "_campaigns_v_latest_idx" ON "_campaigns_v" USING btree ("latest");
  CREATE INDEX "pages_organization_idx" ON "pages" USING btree ("organization_id");
  CREATE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_hero_hero_hero_image_idx" ON "pages" USING btree ("hero_hero_image_id");
  CREATE INDEX "pages_seo_seo_og_image_idx" ON "pages" USING btree ("seo_og_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_organization_idx" ON "_pages_v" USING btree ("version_organization_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_hero_version_hero_hero_image_idx" ON "_pages_v" USING btree ("version_hero_hero_image_id");
  CREATE INDEX "_pages_v_version_seo_version_seo_og_image_idx" ON "_pages_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "banners_organization_idx" ON "banners" USING btree ("organization_id");
  CREATE INDEX "banners_updated_at_idx" ON "banners" USING btree ("updated_at");
  CREATE INDEX "banners_created_at_idx" ON "banners" USING btree ("created_at");
  CREATE INDEX "testimonials_organization_idx" ON "testimonials" USING btree ("organization_id");
  CREATE INDEX "testimonials_avatar_idx" ON "testimonials" USING btree ("avatar_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_tenants_id_idx" ON "payload_locked_documents_rels" USING btree ("tenants_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_campaigns_id_idx" ON "payload_locked_documents_rels" USING btree ("campaigns_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_banners_id_idx" ON "payload_locked_documents_rels" USING btree ("banners_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "tenants" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_organizations" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "products_gallery" CASCADE;
  DROP TABLE "products_features" CASCADE;
  DROP TABLE "products_specifications" CASCADE;
  DROP TABLE "ft_lst" CASCADE;
  DROP TABLE "prc_hl" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "_products_v_version_gallery" CASCADE;
  DROP TABLE "_products_v_version_features" CASCADE;
  DROP TABLE "_products_v_version_specifications" CASCADE;
  DROP TABLE "_ft_lst_v" CASCADE;
  DROP TABLE "_prc_hl_v" CASCADE;
  DROP TABLE "_products_v" CASCADE;
  DROP TABLE "campaigns" CASCADE;
  DROP TABLE "_campaigns_v" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "banners" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_users_organizations_role";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum__products_v_version_status";
  DROP TYPE "public"."enum_campaigns_status";
  DROP TYPE "public"."enum__campaigns_v_version_status";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_banners_placement";`)
}
