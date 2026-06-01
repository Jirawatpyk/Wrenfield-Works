import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_inquiries_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_inquiries_status" AS ENUM('new', 'read', 'archived');
  CREATE TYPE "public"."enum_stats_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__stats_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__stats_v_published_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_client_logos_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__client_logos_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__client_logos_v_published_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_capabilities_icon" AS ENUM('automation', 'tools', 'systems', 'leverage');
  CREATE TYPE "public"."enum_capabilities_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__capabilities_v_version_icon" AS ENUM('automation', 'tools', 'systems', 'leverage');
  CREATE TYPE "public"."enum__capabilities_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__capabilities_v_published_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_case_studies_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__case_studies_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__case_studies_v_published_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_process_steps_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__process_steps_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__process_steps_v_published_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_showcase_surfaces_blocks_mock_row_pill_kind" AS ENUM('ok', 'run');
  CREATE TYPE "public"."enum_showcase_surfaces_blocks_code_lines_lines_kind" AS ENUM('comment', 'keyword', 'string', 'plain');
  CREATE TYPE "public"."enum_showcase_surfaces_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__showcase_surfaces_v_blocks_mock_row_pill_kind" AS ENUM('ok', 'run');
  CREATE TYPE "public"."enum__showcase_surfaces_v_blocks_code_lines_lines_kind" AS ENUM('comment', 'keyword', 'string', 'plain');
  CREATE TYPE "public"."enum__showcase_surfaces_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__showcase_surfaces_v_published_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_hero_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__hero_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__hero_v_published_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_nav_labels_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__nav_labels_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__nav_labels_v_published_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_marquee_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__marquee_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__marquee_v_published_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_section_headings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__section_headings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__section_headings_v_published_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_testimonial_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__testimonial_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__testimonial_v_published_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_call_to_action_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__call_to_action_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__call_to_action_v_published_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_footer_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__footer_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__footer_v_published_locale" AS ENUM('en', 'th');
  CREATE TYPE "public"."enum_seo_metadata_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__seo_metadata_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__seo_metadata_v_published_locale" AS ENUM('en', 'th');
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
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
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
  	"focal_y" numeric
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "inquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"locale" "enum_inquiries_locale" NOT NULL,
  	"consent" boolean DEFAULT false NOT NULL,
  	"consent_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone,
  	"status" "enum_inquiries_status" DEFAULT 'new',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 0,
  	"value" numeric,
  	"unit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_stats_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "stats_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_stats_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_value" numeric,
  	"version_unit" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__stats_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__stats_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_stats_v_locales" (
  	"version_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "client_logos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 0,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_client_logos_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_client_logos_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_name" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__client_logos_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__client_logos_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "capabilities_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "capabilities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 0,
  	"category_label" varchar,
  	"icon" "enum_capabilities_icon",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_capabilities_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "capabilities_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_capabilities_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_capabilities_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_category_label" varchar,
  	"version_icon" "enum__capabilities_v_version_icon",
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__capabilities_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__capabilities_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_capabilities_v_locales" (
  	"version_title" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "case_studies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 0,
  	"tag" varchar,
  	"glyph" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_case_studies_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "case_studies_locales" (
  	"title" varchar,
  	"description" varchar,
  	"metrics_line" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_case_studies_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_tag" varchar,
  	"version_glyph" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__case_studies_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__case_studies_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_case_studies_v_locales" (
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_metrics_line" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "process_steps_checklist" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "process_steps_checklist_locales" (
  	"point" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "process_steps" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 0,
  	"number" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_process_steps_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "process_steps_locales" (
  	"name" varchar,
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_process_steps_v_version_checklist" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_process_steps_v_version_checklist_locales" (
  	"point" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_process_steps_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_number" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__process_steps_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__process_steps_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_process_steps_v_locales" (
  	"version_name" varchar,
  	"version_title" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "showcase_surfaces_blocks_mock_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"sub" varchar,
  	"pill_label" varchar,
  	"pill_kind" "enum_showcase_surfaces_blocks_mock_row_pill_kind",
  	"block_name" varchar
  );
  
  CREATE TABLE "showcase_surfaces_blocks_mock_row_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "showcase_surfaces_blocks_kpi_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "showcase_surfaces_blocks_kpi_grid_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "showcase_surfaces_blocks_kpi_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "showcase_surfaces_blocks_chart_bars" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"height" numeric
  );
  
  CREATE TABLE "showcase_surfaces_blocks_chart" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "showcase_surfaces_blocks_code_lines_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"kind" "enum_showcase_surfaces_blocks_code_lines_lines_kind"
  );
  
  CREATE TABLE "showcase_surfaces_blocks_code_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "showcase_surfaces" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 0,
  	"tab_name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_showcase_surfaces_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "showcase_surfaces_locales" (
  	"tab_title" varchar,
  	"tab_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_showcase_surfaces_v_blocks_mock_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"sub" varchar,
  	"pill_label" varchar,
  	"pill_kind" "enum__showcase_surfaces_v_blocks_mock_row_pill_kind",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_showcase_surfaces_v_blocks_mock_row_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_showcase_surfaces_v_blocks_kpi_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_showcase_surfaces_v_blocks_kpi_grid_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_showcase_surfaces_v_blocks_kpi_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_showcase_surfaces_v_blocks_chart_bars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"height" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_showcase_surfaces_v_blocks_chart" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_showcase_surfaces_v_blocks_code_lines_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"kind" "enum__showcase_surfaces_v_blocks_code_lines_lines_kind",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_showcase_surfaces_v_blocks_code_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_showcase_surfaces_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_tab_name" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__showcase_surfaces_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__showcase_surfaces_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_showcase_surfaces_v_locales" (
  	"version_tab_title" varchar,
  	"version_tab_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
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
  	"users_id" integer,
  	"media_id" integer,
  	"inquiries_id" integer,
  	"stats_id" integer,
  	"client_logos_id" integer,
  	"capabilities_id" integer,
  	"case_studies_id" integer,
  	"process_steps_id" integer,
  	"showcase_surfaces_id" integer
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
  
  CREATE TABLE "hero" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_hero_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "hero_locales" (
  	"kicker" varchar,
  	"headline" jsonb,
  	"subhead" jsonb,
  	"trust_label" varchar,
  	"primary_cta_label" varchar,
  	"secondary_cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hero_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__hero_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__hero_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_hero_v_locales" (
  	"version_kicker" varchar,
  	"version_headline" jsonb,
  	"version_subhead" jsonb,
  	"version_trust_label" varchar,
  	"version_primary_cta_label" varchar,
  	"version_secondary_cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "nav_labels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_nav_labels_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "nav_labels_locales" (
  	"capabilities" varchar,
  	"platform" varchar,
  	"work" varchar,
  	"process" varchar,
  	"cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_nav_labels_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__nav_labels_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__nav_labels_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_nav_labels_v_locales" (
  	"version_capabilities" varchar,
  	"version_platform" varchar,
  	"version_work" varchar,
  	"version_process" varchar,
  	"version_cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "marquee" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_marquee_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "marquee_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_marquee_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__marquee_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__marquee_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_marquee_v_locales" (
  	"version_heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "section_headings_headings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar
  );
  
  CREATE TABLE "section_headings_headings_locales" (
  	"title" jsonb,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "section_headings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_section_headings_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_section_headings_v_version_headings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_section_headings_v_version_headings_locales" (
  	"title" jsonb,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_section_headings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__section_headings_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__section_headings_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "testimonial" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_testimonial_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "testimonial_locales" (
  	"quote" jsonb,
  	"attribution" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_testimonial_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__testimonial_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__testimonial_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_testimonial_v_locales" (
  	"version_quote" jsonb,
  	"version_attribution" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "call_to_action_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "call_to_action" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar,
  	"_status" "enum_call_to_action_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "call_to_action_locales" (
  	"kicker" varchar,
  	"heading" jsonb,
  	"body" varchar,
  	"book_call_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_call_to_action_v_version_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_call_to_action_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_email" varchar,
  	"version__status" "enum__call_to_action_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__call_to_action_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_call_to_action_v_locales" (
  	"version_kicker" varchar,
  	"version_heading" jsonb,
  	"version_body" varchar,
  	"version_book_call_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "footer_studio_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar
  );
  
  CREATE TABLE "footer_studio_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer_connect_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "footer" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_footer_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "footer_locales" (
  	"blurb" varchar,
  	"bottom_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_footer_v_version_studio_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_footer_v_version_studio_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_footer_v_version_connect_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_footer_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__footer_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__footer_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_footer_v_locales" (
  	"version_blurb" varchar,
  	"version_bottom_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "seo_metadata" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"og_image_id" integer,
  	"_status" "enum_seo_metadata_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "seo_metadata_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_seo_metadata_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_og_image_id" integer,
  	"version__status" "enum__seo_metadata_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__seo_metadata_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_seo_metadata_v_locales" (
  	"version_title" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stats_locales" ADD CONSTRAINT "stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stats_v" ADD CONSTRAINT "_stats_v_parent_id_stats_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."stats"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_stats_v_locales" ADD CONSTRAINT "_stats_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_stats_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_client_logos_v" ADD CONSTRAINT "_client_logos_v_parent_id_client_logos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."client_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "capabilities_tags" ADD CONSTRAINT "capabilities_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."capabilities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "capabilities_locales" ADD CONSTRAINT "capabilities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."capabilities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_capabilities_v_version_tags" ADD CONSTRAINT "_capabilities_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_capabilities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_capabilities_v" ADD CONSTRAINT "_capabilities_v_parent_id_capabilities_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."capabilities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_capabilities_v_locales" ADD CONSTRAINT "_capabilities_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_capabilities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_locales" ADD CONSTRAINT "case_studies_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_parent_id_case_studies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_locales" ADD CONSTRAINT "_case_studies_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "process_steps_checklist" ADD CONSTRAINT "process_steps_checklist_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "process_steps_checklist_locales" ADD CONSTRAINT "process_steps_checklist_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."process_steps_checklist"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "process_steps_locales" ADD CONSTRAINT "process_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_process_steps_v_version_checklist" ADD CONSTRAINT "_process_steps_v_version_checklist_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_process_steps_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_process_steps_v_version_checklist_locales" ADD CONSTRAINT "_process_steps_v_version_checklist_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_process_steps_v_version_checklist"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_process_steps_v" ADD CONSTRAINT "_process_steps_v_parent_id_process_steps_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."process_steps"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_process_steps_v_locales" ADD CONSTRAINT "_process_steps_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_process_steps_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "showcase_surfaces_blocks_mock_row" ADD CONSTRAINT "showcase_surfaces_blocks_mock_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."showcase_surfaces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "showcase_surfaces_blocks_mock_row_locales" ADD CONSTRAINT "showcase_surfaces_blocks_mock_row_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."showcase_surfaces_blocks_mock_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "showcase_surfaces_blocks_kpi_grid_items" ADD CONSTRAINT "showcase_surfaces_blocks_kpi_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."showcase_surfaces_blocks_kpi_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "showcase_surfaces_blocks_kpi_grid_items_locales" ADD CONSTRAINT "showcase_surfaces_blocks_kpi_grid_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."showcase_surfaces_blocks_kpi_grid_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "showcase_surfaces_blocks_kpi_grid" ADD CONSTRAINT "showcase_surfaces_blocks_kpi_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."showcase_surfaces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "showcase_surfaces_blocks_chart_bars" ADD CONSTRAINT "showcase_surfaces_blocks_chart_bars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."showcase_surfaces_blocks_chart"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "showcase_surfaces_blocks_chart" ADD CONSTRAINT "showcase_surfaces_blocks_chart_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."showcase_surfaces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "showcase_surfaces_blocks_code_lines_lines" ADD CONSTRAINT "showcase_surfaces_blocks_code_lines_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."showcase_surfaces_blocks_code_lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "showcase_surfaces_blocks_code_lines" ADD CONSTRAINT "showcase_surfaces_blocks_code_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."showcase_surfaces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "showcase_surfaces_locales" ADD CONSTRAINT "showcase_surfaces_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."showcase_surfaces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_showcase_surfaces_v_blocks_mock_row" ADD CONSTRAINT "_showcase_surfaces_v_blocks_mock_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_showcase_surfaces_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_showcase_surfaces_v_blocks_mock_row_locales" ADD CONSTRAINT "_showcase_surfaces_v_blocks_mock_row_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_showcase_surfaces_v_blocks_mock_row"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_showcase_surfaces_v_blocks_kpi_grid_items" ADD CONSTRAINT "_showcase_surfaces_v_blocks_kpi_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_showcase_surfaces_v_blocks_kpi_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_showcase_surfaces_v_blocks_kpi_grid_items_locales" ADD CONSTRAINT "_showcase_surfaces_v_blocks_kpi_grid_items_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_showcase_surfaces_v_blocks_kpi_grid_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_showcase_surfaces_v_blocks_kpi_grid" ADD CONSTRAINT "_showcase_surfaces_v_blocks_kpi_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_showcase_surfaces_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_showcase_surfaces_v_blocks_chart_bars" ADD CONSTRAINT "_showcase_surfaces_v_blocks_chart_bars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_showcase_surfaces_v_blocks_chart"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_showcase_surfaces_v_blocks_chart" ADD CONSTRAINT "_showcase_surfaces_v_blocks_chart_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_showcase_surfaces_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_showcase_surfaces_v_blocks_code_lines_lines" ADD CONSTRAINT "_showcase_surfaces_v_blocks_code_lines_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_showcase_surfaces_v_blocks_code_lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_showcase_surfaces_v_blocks_code_lines" ADD CONSTRAINT "_showcase_surfaces_v_blocks_code_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_showcase_surfaces_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_showcase_surfaces_v" ADD CONSTRAINT "_showcase_surfaces_v_parent_id_showcase_surfaces_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."showcase_surfaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_showcase_surfaces_v_locales" ADD CONSTRAINT "_showcase_surfaces_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_showcase_surfaces_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inquiries_fk" FOREIGN KEY ("inquiries_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stats_fk" FOREIGN KEY ("stats_id") REFERENCES "public"."stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_client_logos_fk" FOREIGN KEY ("client_logos_id") REFERENCES "public"."client_logos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_capabilities_fk" FOREIGN KEY ("capabilities_id") REFERENCES "public"."capabilities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_process_steps_fk" FOREIGN KEY ("process_steps_id") REFERENCES "public"."process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_showcase_surfaces_fk" FOREIGN KEY ("showcase_surfaces_id") REFERENCES "public"."showcase_surfaces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hero_locales" ADD CONSTRAINT "hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hero_v_locales" ADD CONSTRAINT "_hero_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hero_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nav_labels_locales" ADD CONSTRAINT "nav_labels_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nav_labels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_nav_labels_v_locales" ADD CONSTRAINT "_nav_labels_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_nav_labels_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "marquee_locales" ADD CONSTRAINT "marquee_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marquee"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_marquee_v_locales" ADD CONSTRAINT "_marquee_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marquee_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_headings_headings" ADD CONSTRAINT "section_headings_headings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_headings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_headings_headings_locales" ADD CONSTRAINT "section_headings_headings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_headings_headings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_headings_v_version_headings" ADD CONSTRAINT "_section_headings_v_version_headings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_headings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_headings_v_version_headings_locales" ADD CONSTRAINT "_section_headings_v_version_headings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_headings_v_version_headings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "testimonial_locales" ADD CONSTRAINT "testimonial_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."testimonial"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_testimonial_v_locales" ADD CONSTRAINT "_testimonial_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_testimonial_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "call_to_action_social_links" ADD CONSTRAINT "call_to_action_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."call_to_action"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "call_to_action_locales" ADD CONSTRAINT "call_to_action_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."call_to_action"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_call_to_action_v_version_social_links" ADD CONSTRAINT "_call_to_action_v_version_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_call_to_action_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_call_to_action_v_locales" ADD CONSTRAINT "_call_to_action_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_call_to_action_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_studio_links" ADD CONSTRAINT "footer_studio_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_studio_links_locales" ADD CONSTRAINT "footer_studio_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_studio_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_connect_links" ADD CONSTRAINT "footer_connect_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_locales" ADD CONSTRAINT "footer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_v_version_studio_links" ADD CONSTRAINT "_footer_v_version_studio_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_v_version_studio_links_locales" ADD CONSTRAINT "_footer_v_version_studio_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_v_version_studio_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_v_version_connect_links" ADD CONSTRAINT "_footer_v_version_connect_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_v_locales" ADD CONSTRAINT "_footer_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_metadata" ADD CONSTRAINT "seo_metadata_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_metadata_locales" ADD CONSTRAINT "seo_metadata_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seo_metadata"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_seo_metadata_v" ADD CONSTRAINT "_seo_metadata_v_version_og_image_id_media_id_fk" FOREIGN KEY ("version_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_metadata_v_locales" ADD CONSTRAINT "_seo_metadata_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_seo_metadata_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "inquiries_expires_at_idx" ON "inquiries" USING btree ("expires_at");
  CREATE INDEX "inquiries_status_idx" ON "inquiries" USING btree ("status");
  CREATE INDEX "inquiries_updated_at_idx" ON "inquiries" USING btree ("updated_at");
  CREATE INDEX "inquiries_created_at_idx" ON "inquiries" USING btree ("created_at");
  CREATE INDEX "stats_updated_at_idx" ON "stats" USING btree ("updated_at");
  CREATE INDEX "stats_created_at_idx" ON "stats" USING btree ("created_at");
  CREATE INDEX "stats__status_idx" ON "stats" USING btree ("_status");
  CREATE UNIQUE INDEX "stats_locales_locale_parent_id_unique" ON "stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_stats_v_parent_idx" ON "_stats_v" USING btree ("parent_id");
  CREATE INDEX "_stats_v_version_version_updated_at_idx" ON "_stats_v" USING btree ("version_updated_at");
  CREATE INDEX "_stats_v_version_version_created_at_idx" ON "_stats_v" USING btree ("version_created_at");
  CREATE INDEX "_stats_v_version_version__status_idx" ON "_stats_v" USING btree ("version__status");
  CREATE INDEX "_stats_v_created_at_idx" ON "_stats_v" USING btree ("created_at");
  CREATE INDEX "_stats_v_updated_at_idx" ON "_stats_v" USING btree ("updated_at");
  CREATE INDEX "_stats_v_snapshot_idx" ON "_stats_v" USING btree ("snapshot");
  CREATE INDEX "_stats_v_published_locale_idx" ON "_stats_v" USING btree ("published_locale");
  CREATE INDEX "_stats_v_latest_idx" ON "_stats_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_stats_v_locales_locale_parent_id_unique" ON "_stats_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "client_logos_updated_at_idx" ON "client_logos" USING btree ("updated_at");
  CREATE INDEX "client_logos_created_at_idx" ON "client_logos" USING btree ("created_at");
  CREATE INDEX "client_logos__status_idx" ON "client_logos" USING btree ("_status");
  CREATE INDEX "_client_logos_v_parent_idx" ON "_client_logos_v" USING btree ("parent_id");
  CREATE INDEX "_client_logos_v_version_version_updated_at_idx" ON "_client_logos_v" USING btree ("version_updated_at");
  CREATE INDEX "_client_logos_v_version_version_created_at_idx" ON "_client_logos_v" USING btree ("version_created_at");
  CREATE INDEX "_client_logos_v_version_version__status_idx" ON "_client_logos_v" USING btree ("version__status");
  CREATE INDEX "_client_logos_v_created_at_idx" ON "_client_logos_v" USING btree ("created_at");
  CREATE INDEX "_client_logos_v_updated_at_idx" ON "_client_logos_v" USING btree ("updated_at");
  CREATE INDEX "_client_logos_v_snapshot_idx" ON "_client_logos_v" USING btree ("snapshot");
  CREATE INDEX "_client_logos_v_published_locale_idx" ON "_client_logos_v" USING btree ("published_locale");
  CREATE INDEX "_client_logos_v_latest_idx" ON "_client_logos_v" USING btree ("latest");
  CREATE INDEX "capabilities_tags_order_idx" ON "capabilities_tags" USING btree ("_order");
  CREATE INDEX "capabilities_tags_parent_id_idx" ON "capabilities_tags" USING btree ("_parent_id");
  CREATE INDEX "capabilities_updated_at_idx" ON "capabilities" USING btree ("updated_at");
  CREATE INDEX "capabilities_created_at_idx" ON "capabilities" USING btree ("created_at");
  CREATE INDEX "capabilities__status_idx" ON "capabilities" USING btree ("_status");
  CREATE UNIQUE INDEX "capabilities_locales_locale_parent_id_unique" ON "capabilities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_capabilities_v_version_tags_order_idx" ON "_capabilities_v_version_tags" USING btree ("_order");
  CREATE INDEX "_capabilities_v_version_tags_parent_id_idx" ON "_capabilities_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_capabilities_v_parent_idx" ON "_capabilities_v" USING btree ("parent_id");
  CREATE INDEX "_capabilities_v_version_version_updated_at_idx" ON "_capabilities_v" USING btree ("version_updated_at");
  CREATE INDEX "_capabilities_v_version_version_created_at_idx" ON "_capabilities_v" USING btree ("version_created_at");
  CREATE INDEX "_capabilities_v_version_version__status_idx" ON "_capabilities_v" USING btree ("version__status");
  CREATE INDEX "_capabilities_v_created_at_idx" ON "_capabilities_v" USING btree ("created_at");
  CREATE INDEX "_capabilities_v_updated_at_idx" ON "_capabilities_v" USING btree ("updated_at");
  CREATE INDEX "_capabilities_v_snapshot_idx" ON "_capabilities_v" USING btree ("snapshot");
  CREATE INDEX "_capabilities_v_published_locale_idx" ON "_capabilities_v" USING btree ("published_locale");
  CREATE INDEX "_capabilities_v_latest_idx" ON "_capabilities_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_capabilities_v_locales_locale_parent_id_unique" ON "_capabilities_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "case_studies_updated_at_idx" ON "case_studies" USING btree ("updated_at");
  CREATE INDEX "case_studies_created_at_idx" ON "case_studies" USING btree ("created_at");
  CREATE INDEX "case_studies__status_idx" ON "case_studies" USING btree ("_status");
  CREATE UNIQUE INDEX "case_studies_locales_locale_parent_id_unique" ON "case_studies_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_parent_idx" ON "_case_studies_v" USING btree ("parent_id");
  CREATE INDEX "_case_studies_v_version_version_updated_at_idx" ON "_case_studies_v" USING btree ("version_updated_at");
  CREATE INDEX "_case_studies_v_version_version_created_at_idx" ON "_case_studies_v" USING btree ("version_created_at");
  CREATE INDEX "_case_studies_v_version_version__status_idx" ON "_case_studies_v" USING btree ("version__status");
  CREATE INDEX "_case_studies_v_created_at_idx" ON "_case_studies_v" USING btree ("created_at");
  CREATE INDEX "_case_studies_v_updated_at_idx" ON "_case_studies_v" USING btree ("updated_at");
  CREATE INDEX "_case_studies_v_snapshot_idx" ON "_case_studies_v" USING btree ("snapshot");
  CREATE INDEX "_case_studies_v_published_locale_idx" ON "_case_studies_v" USING btree ("published_locale");
  CREATE INDEX "_case_studies_v_latest_idx" ON "_case_studies_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_case_studies_v_locales_locale_parent_id_unique" ON "_case_studies_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "process_steps_checklist_order_idx" ON "process_steps_checklist" USING btree ("_order");
  CREATE INDEX "process_steps_checklist_parent_id_idx" ON "process_steps_checklist" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "process_steps_checklist_locales_locale_parent_id_unique" ON "process_steps_checklist_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "process_steps_updated_at_idx" ON "process_steps" USING btree ("updated_at");
  CREATE INDEX "process_steps_created_at_idx" ON "process_steps" USING btree ("created_at");
  CREATE INDEX "process_steps__status_idx" ON "process_steps" USING btree ("_status");
  CREATE UNIQUE INDEX "process_steps_locales_locale_parent_id_unique" ON "process_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_process_steps_v_version_checklist_order_idx" ON "_process_steps_v_version_checklist" USING btree ("_order");
  CREATE INDEX "_process_steps_v_version_checklist_parent_id_idx" ON "_process_steps_v_version_checklist" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_process_steps_v_version_checklist_locales_locale_parent_id_" ON "_process_steps_v_version_checklist_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_process_steps_v_parent_idx" ON "_process_steps_v" USING btree ("parent_id");
  CREATE INDEX "_process_steps_v_version_version_updated_at_idx" ON "_process_steps_v" USING btree ("version_updated_at");
  CREATE INDEX "_process_steps_v_version_version_created_at_idx" ON "_process_steps_v" USING btree ("version_created_at");
  CREATE INDEX "_process_steps_v_version_version__status_idx" ON "_process_steps_v" USING btree ("version__status");
  CREATE INDEX "_process_steps_v_created_at_idx" ON "_process_steps_v" USING btree ("created_at");
  CREATE INDEX "_process_steps_v_updated_at_idx" ON "_process_steps_v" USING btree ("updated_at");
  CREATE INDEX "_process_steps_v_snapshot_idx" ON "_process_steps_v" USING btree ("snapshot");
  CREATE INDEX "_process_steps_v_published_locale_idx" ON "_process_steps_v" USING btree ("published_locale");
  CREATE INDEX "_process_steps_v_latest_idx" ON "_process_steps_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_process_steps_v_locales_locale_parent_id_unique" ON "_process_steps_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "showcase_surfaces_blocks_mock_row_order_idx" ON "showcase_surfaces_blocks_mock_row" USING btree ("_order");
  CREATE INDEX "showcase_surfaces_blocks_mock_row_parent_id_idx" ON "showcase_surfaces_blocks_mock_row" USING btree ("_parent_id");
  CREATE INDEX "showcase_surfaces_blocks_mock_row_path_idx" ON "showcase_surfaces_blocks_mock_row" USING btree ("_path");
  CREATE UNIQUE INDEX "showcase_surfaces_blocks_mock_row_locales_locale_parent_id_u" ON "showcase_surfaces_blocks_mock_row_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "showcase_surfaces_blocks_kpi_grid_items_order_idx" ON "showcase_surfaces_blocks_kpi_grid_items" USING btree ("_order");
  CREATE INDEX "showcase_surfaces_blocks_kpi_grid_items_parent_id_idx" ON "showcase_surfaces_blocks_kpi_grid_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "showcase_surfaces_blocks_kpi_grid_items_locales_locale_paren" ON "showcase_surfaces_blocks_kpi_grid_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "showcase_surfaces_blocks_kpi_grid_order_idx" ON "showcase_surfaces_blocks_kpi_grid" USING btree ("_order");
  CREATE INDEX "showcase_surfaces_blocks_kpi_grid_parent_id_idx" ON "showcase_surfaces_blocks_kpi_grid" USING btree ("_parent_id");
  CREATE INDEX "showcase_surfaces_blocks_kpi_grid_path_idx" ON "showcase_surfaces_blocks_kpi_grid" USING btree ("_path");
  CREATE INDEX "showcase_surfaces_blocks_chart_bars_order_idx" ON "showcase_surfaces_blocks_chart_bars" USING btree ("_order");
  CREATE INDEX "showcase_surfaces_blocks_chart_bars_parent_id_idx" ON "showcase_surfaces_blocks_chart_bars" USING btree ("_parent_id");
  CREATE INDEX "showcase_surfaces_blocks_chart_order_idx" ON "showcase_surfaces_blocks_chart" USING btree ("_order");
  CREATE INDEX "showcase_surfaces_blocks_chart_parent_id_idx" ON "showcase_surfaces_blocks_chart" USING btree ("_parent_id");
  CREATE INDEX "showcase_surfaces_blocks_chart_path_idx" ON "showcase_surfaces_blocks_chart" USING btree ("_path");
  CREATE INDEX "showcase_surfaces_blocks_code_lines_lines_order_idx" ON "showcase_surfaces_blocks_code_lines_lines" USING btree ("_order");
  CREATE INDEX "showcase_surfaces_blocks_code_lines_lines_parent_id_idx" ON "showcase_surfaces_blocks_code_lines_lines" USING btree ("_parent_id");
  CREATE INDEX "showcase_surfaces_blocks_code_lines_order_idx" ON "showcase_surfaces_blocks_code_lines" USING btree ("_order");
  CREATE INDEX "showcase_surfaces_blocks_code_lines_parent_id_idx" ON "showcase_surfaces_blocks_code_lines" USING btree ("_parent_id");
  CREATE INDEX "showcase_surfaces_blocks_code_lines_path_idx" ON "showcase_surfaces_blocks_code_lines" USING btree ("_path");
  CREATE INDEX "showcase_surfaces_updated_at_idx" ON "showcase_surfaces" USING btree ("updated_at");
  CREATE INDEX "showcase_surfaces_created_at_idx" ON "showcase_surfaces" USING btree ("created_at");
  CREATE INDEX "showcase_surfaces__status_idx" ON "showcase_surfaces" USING btree ("_status");
  CREATE UNIQUE INDEX "showcase_surfaces_locales_locale_parent_id_unique" ON "showcase_surfaces_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_showcase_surfaces_v_blocks_mock_row_order_idx" ON "_showcase_surfaces_v_blocks_mock_row" USING btree ("_order");
  CREATE INDEX "_showcase_surfaces_v_blocks_mock_row_parent_id_idx" ON "_showcase_surfaces_v_blocks_mock_row" USING btree ("_parent_id");
  CREATE INDEX "_showcase_surfaces_v_blocks_mock_row_path_idx" ON "_showcase_surfaces_v_blocks_mock_row" USING btree ("_path");
  CREATE UNIQUE INDEX "_showcase_surfaces_v_blocks_mock_row_locales_locale_parent_i" ON "_showcase_surfaces_v_blocks_mock_row_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_showcase_surfaces_v_blocks_kpi_grid_items_order_idx" ON "_showcase_surfaces_v_blocks_kpi_grid_items" USING btree ("_order");
  CREATE INDEX "_showcase_surfaces_v_blocks_kpi_grid_items_parent_id_idx" ON "_showcase_surfaces_v_blocks_kpi_grid_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_showcase_surfaces_v_blocks_kpi_grid_items_locales_locale_pa" ON "_showcase_surfaces_v_blocks_kpi_grid_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_showcase_surfaces_v_blocks_kpi_grid_order_idx" ON "_showcase_surfaces_v_blocks_kpi_grid" USING btree ("_order");
  CREATE INDEX "_showcase_surfaces_v_blocks_kpi_grid_parent_id_idx" ON "_showcase_surfaces_v_blocks_kpi_grid" USING btree ("_parent_id");
  CREATE INDEX "_showcase_surfaces_v_blocks_kpi_grid_path_idx" ON "_showcase_surfaces_v_blocks_kpi_grid" USING btree ("_path");
  CREATE INDEX "_showcase_surfaces_v_blocks_chart_bars_order_idx" ON "_showcase_surfaces_v_blocks_chart_bars" USING btree ("_order");
  CREATE INDEX "_showcase_surfaces_v_blocks_chart_bars_parent_id_idx" ON "_showcase_surfaces_v_blocks_chart_bars" USING btree ("_parent_id");
  CREATE INDEX "_showcase_surfaces_v_blocks_chart_order_idx" ON "_showcase_surfaces_v_blocks_chart" USING btree ("_order");
  CREATE INDEX "_showcase_surfaces_v_blocks_chart_parent_id_idx" ON "_showcase_surfaces_v_blocks_chart" USING btree ("_parent_id");
  CREATE INDEX "_showcase_surfaces_v_blocks_chart_path_idx" ON "_showcase_surfaces_v_blocks_chart" USING btree ("_path");
  CREATE INDEX "_showcase_surfaces_v_blocks_code_lines_lines_order_idx" ON "_showcase_surfaces_v_blocks_code_lines_lines" USING btree ("_order");
  CREATE INDEX "_showcase_surfaces_v_blocks_code_lines_lines_parent_id_idx" ON "_showcase_surfaces_v_blocks_code_lines_lines" USING btree ("_parent_id");
  CREATE INDEX "_showcase_surfaces_v_blocks_code_lines_order_idx" ON "_showcase_surfaces_v_blocks_code_lines" USING btree ("_order");
  CREATE INDEX "_showcase_surfaces_v_blocks_code_lines_parent_id_idx" ON "_showcase_surfaces_v_blocks_code_lines" USING btree ("_parent_id");
  CREATE INDEX "_showcase_surfaces_v_blocks_code_lines_path_idx" ON "_showcase_surfaces_v_blocks_code_lines" USING btree ("_path");
  CREATE INDEX "_showcase_surfaces_v_parent_idx" ON "_showcase_surfaces_v" USING btree ("parent_id");
  CREATE INDEX "_showcase_surfaces_v_version_version_updated_at_idx" ON "_showcase_surfaces_v" USING btree ("version_updated_at");
  CREATE INDEX "_showcase_surfaces_v_version_version_created_at_idx" ON "_showcase_surfaces_v" USING btree ("version_created_at");
  CREATE INDEX "_showcase_surfaces_v_version_version__status_idx" ON "_showcase_surfaces_v" USING btree ("version__status");
  CREATE INDEX "_showcase_surfaces_v_created_at_idx" ON "_showcase_surfaces_v" USING btree ("created_at");
  CREATE INDEX "_showcase_surfaces_v_updated_at_idx" ON "_showcase_surfaces_v" USING btree ("updated_at");
  CREATE INDEX "_showcase_surfaces_v_snapshot_idx" ON "_showcase_surfaces_v" USING btree ("snapshot");
  CREATE INDEX "_showcase_surfaces_v_published_locale_idx" ON "_showcase_surfaces_v" USING btree ("published_locale");
  CREATE INDEX "_showcase_surfaces_v_latest_idx" ON "_showcase_surfaces_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_showcase_surfaces_v_locales_locale_parent_id_unique" ON "_showcase_surfaces_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_inquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("inquiries_id");
  CREATE INDEX "payload_locked_documents_rels_stats_id_idx" ON "payload_locked_documents_rels" USING btree ("stats_id");
  CREATE INDEX "payload_locked_documents_rels_client_logos_id_idx" ON "payload_locked_documents_rels" USING btree ("client_logos_id");
  CREATE INDEX "payload_locked_documents_rels_capabilities_id_idx" ON "payload_locked_documents_rels" USING btree ("capabilities_id");
  CREATE INDEX "payload_locked_documents_rels_case_studies_id_idx" ON "payload_locked_documents_rels" USING btree ("case_studies_id");
  CREATE INDEX "payload_locked_documents_rels_process_steps_id_idx" ON "payload_locked_documents_rels" USING btree ("process_steps_id");
  CREATE INDEX "payload_locked_documents_rels_showcase_surfaces_id_idx" ON "payload_locked_documents_rels" USING btree ("showcase_surfaces_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "hero__status_idx" ON "hero" USING btree ("_status");
  CREATE UNIQUE INDEX "hero_locales_locale_parent_id_unique" ON "hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hero_v_version_version__status_idx" ON "_hero_v" USING btree ("version__status");
  CREATE INDEX "_hero_v_created_at_idx" ON "_hero_v" USING btree ("created_at");
  CREATE INDEX "_hero_v_updated_at_idx" ON "_hero_v" USING btree ("updated_at");
  CREATE INDEX "_hero_v_snapshot_idx" ON "_hero_v" USING btree ("snapshot");
  CREATE INDEX "_hero_v_published_locale_idx" ON "_hero_v" USING btree ("published_locale");
  CREATE INDEX "_hero_v_latest_idx" ON "_hero_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_hero_v_locales_locale_parent_id_unique" ON "_hero_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "nav_labels__status_idx" ON "nav_labels" USING btree ("_status");
  CREATE UNIQUE INDEX "nav_labels_locales_locale_parent_id_unique" ON "nav_labels_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_nav_labels_v_version_version__status_idx" ON "_nav_labels_v" USING btree ("version__status");
  CREATE INDEX "_nav_labels_v_created_at_idx" ON "_nav_labels_v" USING btree ("created_at");
  CREATE INDEX "_nav_labels_v_updated_at_idx" ON "_nav_labels_v" USING btree ("updated_at");
  CREATE INDEX "_nav_labels_v_snapshot_idx" ON "_nav_labels_v" USING btree ("snapshot");
  CREATE INDEX "_nav_labels_v_published_locale_idx" ON "_nav_labels_v" USING btree ("published_locale");
  CREATE INDEX "_nav_labels_v_latest_idx" ON "_nav_labels_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_nav_labels_v_locales_locale_parent_id_unique" ON "_nav_labels_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "marquee__status_idx" ON "marquee" USING btree ("_status");
  CREATE UNIQUE INDEX "marquee_locales_locale_parent_id_unique" ON "marquee_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_marquee_v_version_version__status_idx" ON "_marquee_v" USING btree ("version__status");
  CREATE INDEX "_marquee_v_created_at_idx" ON "_marquee_v" USING btree ("created_at");
  CREATE INDEX "_marquee_v_updated_at_idx" ON "_marquee_v" USING btree ("updated_at");
  CREATE INDEX "_marquee_v_snapshot_idx" ON "_marquee_v" USING btree ("snapshot");
  CREATE INDEX "_marquee_v_published_locale_idx" ON "_marquee_v" USING btree ("published_locale");
  CREATE INDEX "_marquee_v_latest_idx" ON "_marquee_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_marquee_v_locales_locale_parent_id_unique" ON "_marquee_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "section_headings_headings_order_idx" ON "section_headings_headings" USING btree ("_order");
  CREATE INDEX "section_headings_headings_parent_id_idx" ON "section_headings_headings" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "section_headings_headings_locales_locale_parent_id_unique" ON "section_headings_headings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "section_headings__status_idx" ON "section_headings" USING btree ("_status");
  CREATE INDEX "_section_headings_v_version_headings_order_idx" ON "_section_headings_v_version_headings" USING btree ("_order");
  CREATE INDEX "_section_headings_v_version_headings_parent_id_idx" ON "_section_headings_v_version_headings" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_section_headings_v_version_headings_locales_locale_parent_i" ON "_section_headings_v_version_headings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_section_headings_v_version_version__status_idx" ON "_section_headings_v" USING btree ("version__status");
  CREATE INDEX "_section_headings_v_created_at_idx" ON "_section_headings_v" USING btree ("created_at");
  CREATE INDEX "_section_headings_v_updated_at_idx" ON "_section_headings_v" USING btree ("updated_at");
  CREATE INDEX "_section_headings_v_snapshot_idx" ON "_section_headings_v" USING btree ("snapshot");
  CREATE INDEX "_section_headings_v_published_locale_idx" ON "_section_headings_v" USING btree ("published_locale");
  CREATE INDEX "_section_headings_v_latest_idx" ON "_section_headings_v" USING btree ("latest");
  CREATE INDEX "testimonial__status_idx" ON "testimonial" USING btree ("_status");
  CREATE UNIQUE INDEX "testimonial_locales_locale_parent_id_unique" ON "testimonial_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_testimonial_v_version_version__status_idx" ON "_testimonial_v" USING btree ("version__status");
  CREATE INDEX "_testimonial_v_created_at_idx" ON "_testimonial_v" USING btree ("created_at");
  CREATE INDEX "_testimonial_v_updated_at_idx" ON "_testimonial_v" USING btree ("updated_at");
  CREATE INDEX "_testimonial_v_snapshot_idx" ON "_testimonial_v" USING btree ("snapshot");
  CREATE INDEX "_testimonial_v_published_locale_idx" ON "_testimonial_v" USING btree ("published_locale");
  CREATE INDEX "_testimonial_v_latest_idx" ON "_testimonial_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_testimonial_v_locales_locale_parent_id_unique" ON "_testimonial_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "call_to_action_social_links_order_idx" ON "call_to_action_social_links" USING btree ("_order");
  CREATE INDEX "call_to_action_social_links_parent_id_idx" ON "call_to_action_social_links" USING btree ("_parent_id");
  CREATE INDEX "call_to_action__status_idx" ON "call_to_action" USING btree ("_status");
  CREATE UNIQUE INDEX "call_to_action_locales_locale_parent_id_unique" ON "call_to_action_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_call_to_action_v_version_social_links_order_idx" ON "_call_to_action_v_version_social_links" USING btree ("_order");
  CREATE INDEX "_call_to_action_v_version_social_links_parent_id_idx" ON "_call_to_action_v_version_social_links" USING btree ("_parent_id");
  CREATE INDEX "_call_to_action_v_version_version__status_idx" ON "_call_to_action_v" USING btree ("version__status");
  CREATE INDEX "_call_to_action_v_created_at_idx" ON "_call_to_action_v" USING btree ("created_at");
  CREATE INDEX "_call_to_action_v_updated_at_idx" ON "_call_to_action_v" USING btree ("updated_at");
  CREATE INDEX "_call_to_action_v_snapshot_idx" ON "_call_to_action_v" USING btree ("snapshot");
  CREATE INDEX "_call_to_action_v_published_locale_idx" ON "_call_to_action_v" USING btree ("published_locale");
  CREATE INDEX "_call_to_action_v_latest_idx" ON "_call_to_action_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_call_to_action_v_locales_locale_parent_id_unique" ON "_call_to_action_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_studio_links_order_idx" ON "footer_studio_links" USING btree ("_order");
  CREATE INDEX "footer_studio_links_parent_id_idx" ON "footer_studio_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_studio_links_locales_locale_parent_id_unique" ON "footer_studio_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_connect_links_order_idx" ON "footer_connect_links" USING btree ("_order");
  CREATE INDEX "footer_connect_links_parent_id_idx" ON "footer_connect_links" USING btree ("_parent_id");
  CREATE INDEX "footer__status_idx" ON "footer" USING btree ("_status");
  CREATE UNIQUE INDEX "footer_locales_locale_parent_id_unique" ON "footer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_footer_v_version_studio_links_order_idx" ON "_footer_v_version_studio_links" USING btree ("_order");
  CREATE INDEX "_footer_v_version_studio_links_parent_id_idx" ON "_footer_v_version_studio_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_footer_v_version_studio_links_locales_locale_parent_id_uniq" ON "_footer_v_version_studio_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_footer_v_version_connect_links_order_idx" ON "_footer_v_version_connect_links" USING btree ("_order");
  CREATE INDEX "_footer_v_version_connect_links_parent_id_idx" ON "_footer_v_version_connect_links" USING btree ("_parent_id");
  CREATE INDEX "_footer_v_version_version__status_idx" ON "_footer_v" USING btree ("version__status");
  CREATE INDEX "_footer_v_created_at_idx" ON "_footer_v" USING btree ("created_at");
  CREATE INDEX "_footer_v_updated_at_idx" ON "_footer_v" USING btree ("updated_at");
  CREATE INDEX "_footer_v_snapshot_idx" ON "_footer_v" USING btree ("snapshot");
  CREATE INDEX "_footer_v_published_locale_idx" ON "_footer_v" USING btree ("published_locale");
  CREATE INDEX "_footer_v_latest_idx" ON "_footer_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_footer_v_locales_locale_parent_id_unique" ON "_footer_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "seo_metadata_og_image_idx" ON "seo_metadata" USING btree ("og_image_id");
  CREATE INDEX "seo_metadata__status_idx" ON "seo_metadata" USING btree ("_status");
  CREATE UNIQUE INDEX "seo_metadata_locales_locale_parent_id_unique" ON "seo_metadata_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_seo_metadata_v_version_version_og_image_idx" ON "_seo_metadata_v" USING btree ("version_og_image_id");
  CREATE INDEX "_seo_metadata_v_version_version__status_idx" ON "_seo_metadata_v" USING btree ("version__status");
  CREATE INDEX "_seo_metadata_v_created_at_idx" ON "_seo_metadata_v" USING btree ("created_at");
  CREATE INDEX "_seo_metadata_v_updated_at_idx" ON "_seo_metadata_v" USING btree ("updated_at");
  CREATE INDEX "_seo_metadata_v_snapshot_idx" ON "_seo_metadata_v" USING btree ("snapshot");
  CREATE INDEX "_seo_metadata_v_published_locale_idx" ON "_seo_metadata_v" USING btree ("published_locale");
  CREATE INDEX "_seo_metadata_v_latest_idx" ON "_seo_metadata_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_seo_metadata_v_locales_locale_parent_id_unique" ON "_seo_metadata_v_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "inquiries" CASCADE;
  DROP TABLE "stats" CASCADE;
  DROP TABLE "stats_locales" CASCADE;
  DROP TABLE "_stats_v" CASCADE;
  DROP TABLE "_stats_v_locales" CASCADE;
  DROP TABLE "client_logos" CASCADE;
  DROP TABLE "_client_logos_v" CASCADE;
  DROP TABLE "capabilities_tags" CASCADE;
  DROP TABLE "capabilities" CASCADE;
  DROP TABLE "capabilities_locales" CASCADE;
  DROP TABLE "_capabilities_v_version_tags" CASCADE;
  DROP TABLE "_capabilities_v" CASCADE;
  DROP TABLE "_capabilities_v_locales" CASCADE;
  DROP TABLE "case_studies" CASCADE;
  DROP TABLE "case_studies_locales" CASCADE;
  DROP TABLE "_case_studies_v" CASCADE;
  DROP TABLE "_case_studies_v_locales" CASCADE;
  DROP TABLE "process_steps_checklist" CASCADE;
  DROP TABLE "process_steps_checklist_locales" CASCADE;
  DROP TABLE "process_steps" CASCADE;
  DROP TABLE "process_steps_locales" CASCADE;
  DROP TABLE "_process_steps_v_version_checklist" CASCADE;
  DROP TABLE "_process_steps_v_version_checklist_locales" CASCADE;
  DROP TABLE "_process_steps_v" CASCADE;
  DROP TABLE "_process_steps_v_locales" CASCADE;
  DROP TABLE "showcase_surfaces_blocks_mock_row" CASCADE;
  DROP TABLE "showcase_surfaces_blocks_mock_row_locales" CASCADE;
  DROP TABLE "showcase_surfaces_blocks_kpi_grid_items" CASCADE;
  DROP TABLE "showcase_surfaces_blocks_kpi_grid_items_locales" CASCADE;
  DROP TABLE "showcase_surfaces_blocks_kpi_grid" CASCADE;
  DROP TABLE "showcase_surfaces_blocks_chart_bars" CASCADE;
  DROP TABLE "showcase_surfaces_blocks_chart" CASCADE;
  DROP TABLE "showcase_surfaces_blocks_code_lines_lines" CASCADE;
  DROP TABLE "showcase_surfaces_blocks_code_lines" CASCADE;
  DROP TABLE "showcase_surfaces" CASCADE;
  DROP TABLE "showcase_surfaces_locales" CASCADE;
  DROP TABLE "_showcase_surfaces_v_blocks_mock_row" CASCADE;
  DROP TABLE "_showcase_surfaces_v_blocks_mock_row_locales" CASCADE;
  DROP TABLE "_showcase_surfaces_v_blocks_kpi_grid_items" CASCADE;
  DROP TABLE "_showcase_surfaces_v_blocks_kpi_grid_items_locales" CASCADE;
  DROP TABLE "_showcase_surfaces_v_blocks_kpi_grid" CASCADE;
  DROP TABLE "_showcase_surfaces_v_blocks_chart_bars" CASCADE;
  DROP TABLE "_showcase_surfaces_v_blocks_chart" CASCADE;
  DROP TABLE "_showcase_surfaces_v_blocks_code_lines_lines" CASCADE;
  DROP TABLE "_showcase_surfaces_v_blocks_code_lines" CASCADE;
  DROP TABLE "_showcase_surfaces_v" CASCADE;
  DROP TABLE "_showcase_surfaces_v_locales" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "hero" CASCADE;
  DROP TABLE "hero_locales" CASCADE;
  DROP TABLE "_hero_v" CASCADE;
  DROP TABLE "_hero_v_locales" CASCADE;
  DROP TABLE "nav_labels" CASCADE;
  DROP TABLE "nav_labels_locales" CASCADE;
  DROP TABLE "_nav_labels_v" CASCADE;
  DROP TABLE "_nav_labels_v_locales" CASCADE;
  DROP TABLE "marquee" CASCADE;
  DROP TABLE "marquee_locales" CASCADE;
  DROP TABLE "_marquee_v" CASCADE;
  DROP TABLE "_marquee_v_locales" CASCADE;
  DROP TABLE "section_headings_headings" CASCADE;
  DROP TABLE "section_headings_headings_locales" CASCADE;
  DROP TABLE "section_headings" CASCADE;
  DROP TABLE "_section_headings_v_version_headings" CASCADE;
  DROP TABLE "_section_headings_v_version_headings_locales" CASCADE;
  DROP TABLE "_section_headings_v" CASCADE;
  DROP TABLE "testimonial" CASCADE;
  DROP TABLE "testimonial_locales" CASCADE;
  DROP TABLE "_testimonial_v" CASCADE;
  DROP TABLE "_testimonial_v_locales" CASCADE;
  DROP TABLE "call_to_action_social_links" CASCADE;
  DROP TABLE "call_to_action" CASCADE;
  DROP TABLE "call_to_action_locales" CASCADE;
  DROP TABLE "_call_to_action_v_version_social_links" CASCADE;
  DROP TABLE "_call_to_action_v" CASCADE;
  DROP TABLE "_call_to_action_v_locales" CASCADE;
  DROP TABLE "footer_studio_links" CASCADE;
  DROP TABLE "footer_studio_links_locales" CASCADE;
  DROP TABLE "footer_connect_links" CASCADE;
  DROP TABLE "footer" CASCADE;
  DROP TABLE "footer_locales" CASCADE;
  DROP TABLE "_footer_v_version_studio_links" CASCADE;
  DROP TABLE "_footer_v_version_studio_links_locales" CASCADE;
  DROP TABLE "_footer_v_version_connect_links" CASCADE;
  DROP TABLE "_footer_v" CASCADE;
  DROP TABLE "_footer_v_locales" CASCADE;
  DROP TABLE "seo_metadata" CASCADE;
  DROP TABLE "seo_metadata_locales" CASCADE;
  DROP TABLE "_seo_metadata_v" CASCADE;
  DROP TABLE "_seo_metadata_v_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_inquiries_locale";
  DROP TYPE "public"."enum_inquiries_status";
  DROP TYPE "public"."enum_stats_status";
  DROP TYPE "public"."enum__stats_v_version_status";
  DROP TYPE "public"."enum__stats_v_published_locale";
  DROP TYPE "public"."enum_client_logos_status";
  DROP TYPE "public"."enum__client_logos_v_version_status";
  DROP TYPE "public"."enum__client_logos_v_published_locale";
  DROP TYPE "public"."enum_capabilities_icon";
  DROP TYPE "public"."enum_capabilities_status";
  DROP TYPE "public"."enum__capabilities_v_version_icon";
  DROP TYPE "public"."enum__capabilities_v_version_status";
  DROP TYPE "public"."enum__capabilities_v_published_locale";
  DROP TYPE "public"."enum_case_studies_status";
  DROP TYPE "public"."enum__case_studies_v_version_status";
  DROP TYPE "public"."enum__case_studies_v_published_locale";
  DROP TYPE "public"."enum_process_steps_status";
  DROP TYPE "public"."enum__process_steps_v_version_status";
  DROP TYPE "public"."enum__process_steps_v_published_locale";
  DROP TYPE "public"."enum_showcase_surfaces_blocks_mock_row_pill_kind";
  DROP TYPE "public"."enum_showcase_surfaces_blocks_code_lines_lines_kind";
  DROP TYPE "public"."enum_showcase_surfaces_status";
  DROP TYPE "public"."enum__showcase_surfaces_v_blocks_mock_row_pill_kind";
  DROP TYPE "public"."enum__showcase_surfaces_v_blocks_code_lines_lines_kind";
  DROP TYPE "public"."enum__showcase_surfaces_v_version_status";
  DROP TYPE "public"."enum__showcase_surfaces_v_published_locale";
  DROP TYPE "public"."enum_hero_status";
  DROP TYPE "public"."enum__hero_v_version_status";
  DROP TYPE "public"."enum__hero_v_published_locale";
  DROP TYPE "public"."enum_nav_labels_status";
  DROP TYPE "public"."enum__nav_labels_v_version_status";
  DROP TYPE "public"."enum__nav_labels_v_published_locale";
  DROP TYPE "public"."enum_marquee_status";
  DROP TYPE "public"."enum__marquee_v_version_status";
  DROP TYPE "public"."enum__marquee_v_published_locale";
  DROP TYPE "public"."enum_section_headings_status";
  DROP TYPE "public"."enum__section_headings_v_version_status";
  DROP TYPE "public"."enum__section_headings_v_published_locale";
  DROP TYPE "public"."enum_testimonial_status";
  DROP TYPE "public"."enum__testimonial_v_version_status";
  DROP TYPE "public"."enum__testimonial_v_published_locale";
  DROP TYPE "public"."enum_call_to_action_status";
  DROP TYPE "public"."enum__call_to_action_v_version_status";
  DROP TYPE "public"."enum__call_to_action_v_published_locale";
  DROP TYPE "public"."enum_footer_status";
  DROP TYPE "public"."enum__footer_v_version_status";
  DROP TYPE "public"."enum__footer_v_published_locale";
  DROP TYPE "public"."enum_seo_metadata_status";
  DROP TYPE "public"."enum__seo_metadata_v_version_status";
  DROP TYPE "public"."enum__seo_metadata_v_published_locale";`)
}
