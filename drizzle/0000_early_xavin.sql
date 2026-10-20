CREATE TABLE "case_study_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"block_type" varchar(50) NOT NULL,
	"heading" text NOT NULL,
	"content" text,
	"media_url" text,
	"media_caption" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"url" text NOT NULL,
	"secure_url" text NOT NULL,
	"format" varchar(20),
	"width" integer,
	"height" integer,
	"bytes" integer,
	"resource_type" varchar(20) DEFAULT 'image' NOT NULL,
	"access_mode" varchar(20) DEFAULT 'public' NOT NULL,
	"alt_text" text,
	"caption" text,
	"folder" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"cover_image" text,
	"category" varchar(50) DEFAULT 'build-log' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"seo_title" varchar(255),
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"short_description" text NOT NULL,
	"content" text,
	"category" varchar(100) NOT NULL,
	"project_type" varchar(50) DEFAULT 'side-project' NOT NULL,
	"role" text,
	"cover_image" text,
	"gallery_images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(30) DEFAULT 'concept' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"display_name" text DEFAULT 'Sai Dwarak' NOT NULL,
	"hero_headline" text DEFAULT 'UI/UX Designer & AI Product Builder' NOT NULL,
	"hero_intro" text DEFAULT 'I design thoughtful digital experiences and build AI-powered products. My work explores the intersection of UI/UX design, product thinking, prototyping, and artificial intelligence—from early concepts to functional prototypes.' NOT NULL,
	"about_content" jsonb DEFAULT '{"philosophy":"Designing at the seams of craft and intelligence. I specialize in turning ambiguous concepts into functional prototypes and production-ready digital products.","background":"With a strong focus on design systems, human-centered UI/UX, and generative AI interfaces, I build software that feels intuitive, responsive, and tactile.","location":"Hyderabad, India","open_to_work":true}'::jsonb NOT NULL,
	"contact_links" jsonb DEFAULT '{"email":"saidwarak99@gmail.com","linkedin":"https://www.linkedin.com/in/sai-dwarak99/","github":"https://github.com/saidwarak99"}'::jsonb NOT NULL,
	"theme_tokens" jsonb DEFAULT '{"canvas":"#FFF7F5","accent":"#EC2929","ink":"#230D10","surface":"#F5D9D5","border":"#E8CEC9"}'::jsonb NOT NULL,
	"section_visibility" jsonb DEFAULT '{"ai_products":true,"ux_ui_projects":true,"tools":true,"build_logs":true,"about":true,"contact":true,"resume":false}'::jsonb NOT NULL,
	"character_settings" jsonb DEFAULT '{"hero_pose":"hero","about_pose":"bust","tools_pose":"laptop","connect_pose":"standing","hero_asset_url":"/images/character/sai-hero.png","about_asset_url":"/images/character/sai-bust.png","tools_asset_url":"/images/character/sai-laptop.png","connect_asset_url":"/images/character/sai-standing.png"}'::jsonb NOT NULL,
	"resume_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tool_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon_url" text,
	"external_url" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "case_study_blocks" ADD CONSTRAINT "case_study_blocks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_category_id_tool_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tool_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_study_blocks_project_order_idx" ON "case_study_blocks" USING btree ("project_id","display_order");--> statement-breakpoint
CREATE INDEX "media_assets_folder_idx" ON "media_assets" USING btree ("folder");--> statement-breakpoint
CREATE INDEX "media_assets_access_mode_idx" ON "media_assets" USING btree ("access_mode");--> statement-breakpoint
CREATE INDEX "posts_published_idx" ON "posts" USING btree ("is_published","published_at");--> statement-breakpoint
CREATE INDEX "projects_category_idx" ON "projects" USING btree ("category");--> statement-breakpoint
CREATE INDEX "projects_published_idx" ON "projects" USING btree ("is_published","display_order");--> statement-breakpoint
CREATE INDEX "projects_featured_idx" ON "projects" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "tools_category_order_idx" ON "tools" USING btree ("category_id","display_order");--> statement-breakpoint
CREATE INDEX "tools_visible_idx" ON "tools" USING btree ("is_visible","display_order");