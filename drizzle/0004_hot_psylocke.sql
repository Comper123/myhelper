CREATE TABLE "financial_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(8) NOT NULL,
	"name" varchar(80) NOT NULL,
	"color" varchar(7) DEFAULT '#625cf0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "financial_categories_user_type_name_unique" ON "financial_categories" USING btree ("user_id","type","name");
--> statement-breakpoint
INSERT INTO "financial_categories" ("user_id", "type", "name", "color")
SELECT u."id", d."type", d."name", d."color"
FROM "users" u
CROSS JOIN (VALUES
  ('expense', 'Продукты', '#f97316'), ('expense', 'Жильё', '#8b5cf6'),
  ('expense', 'Транспорт', '#06b6d4'), ('expense', 'Здоровье', '#ec4899'),
  ('expense', 'Подписки', '#6366f1'), ('expense', 'Развлечения', '#eab308'),
  ('expense', 'Покупки', '#14b8a6'), ('expense', 'Другое', '#64748b'),
  ('income', 'Зарплата', '#22c55e'), ('income', 'Фриланс', '#0ea5e9'),
  ('income', 'Подарки', '#d946ef'), ('income', 'Другое', '#64748b')
) AS d("type", "name", "color")
ON CONFLICT ("user_id", "type", "name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "financial_categories" ("user_id", "type", "name", "color")
SELECT DISTINCT t."user_id", t."type", t."category", CASE WHEN t."type" = 'income' THEN '#22c55e' ELSE '#f97316' END
FROM "financial_transactions" t
WHERE t."type" IN ('income', 'expense')
ON CONFLICT ("user_id", "type", "name") DO NOTHING;
