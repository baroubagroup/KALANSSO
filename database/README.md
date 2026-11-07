# GUIDE DÉVELOPPEUR : BASE DE DONNÉES kalansso os

Ce dossier contient la modélisation complète et prête à l'emploi de la base de données relationnelle pour **kalansso os**.

---

## 📁 FICHIERS INCLUS

| Fichier | Format | Usage Recommandé |
| :--- | :--- | :--- |
| [`schema.sql`](schema.sql) | SQL Pur (PostgreSQL 16+) | À exécuter directement dans PostgreSQL, Supabase, Neon, AWS RDS ou Docker. |
| [`schema.prisma`](schema.prisma) | Schéma Prisma ORM | Pour les développeurs backend (NestJS, Next.js, Express, Fastify). |

---

## 🚀 DÉMARRAGE RAPIDE AVEC DOCKER

Si vous souhaitez lancer une instance locale PostgreSQL 16 en 10 secondes :

```bash
docker run --name kalansso-postgres \
  -e POSTGRES_DB=kalansso_db \
  -e POSTGRES_USER=kalansso_admin \
  -e POSTGRES_PASSWORD=kalansso_secret_2026 \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### Exécution du script SQL :
```bash
docker exec -i kalansso-postgres psql -U kalansso_admin -d kalansso_db < schema.sql
```

---

## 🛠️ DÉMARRAGE RAPIDE AVEC PRISMA ORM

Dans votre projet backend TypeScript (NestJS ou Next.js) :

```bash
# 1. Installer Prisma
npm install prisma @prisma/client

# 2. Configurer votre .env
# DATABASE_URL="postgresql://kalansso_admin:kalansso_secret_2026@localhost:5432/kalansso_db?schema=public"

# 3. Synchroniser la base de données
npx prisma db push

# 4. Générer le client Prisma TypeScript
npx prisma generate
```

---

## 🔒 POINTS CLÉS D'ARCHITECTURE & SÉCURITÉ

1. **Multi-Tenancy Strict (`school_id`) :** Chaque table métier possède un `school_id` isolé. Aucun risque de fuite de données entre deux écoles.
2. **Audit Immuable (`audit_logs`) :** Toute modification de note ou annulation de reçu financier est tracée de manière inaltérable (qui, quand, adresse IP, ancienne valeur, nouvelle valeur).
3. **Scellement Cryptographique des Bulletins (`digital_signature_hash`) :** Empreinte SHA-256 unique générée à chaque délibération pour vérification publique par QR Code.
4. **Indexation Optimale :** Index composites créés sur les recherches fréquentes (matricule, QR signature, reçus, classes, dates de présence).
