# Guida al Deploy - Tennis Club Application

Questa guida spiega come deployare l'applicazione Tennis Club su servizi cloud gratuiti:
- **Frontend (Angular)**: Netlify
- **Backend (Spring Boot)**: Railway
- **Database (PostgreSQL)**: Railway (incluso)

---

## Prerequisiti

1. Account GitHub con il repository del progetto
2. Account Netlify (gratuito): https://app.netlify.com/signup
3. Account Railway (gratuito, $5/mese di crediti): https://railway.app

---

## PARTE 1: Deploy del Backend su Railway

### Step 1.1: Preparare il Repository

Assicurati che il progetto sia su GitHub. Se non lo hai ancora fatto:

```bash
cd C:\Users\frenk\Documents\Tennis
git add .
git commit -m "Prepare for cloud deployment"
git push origin master
```

### Step 1.2: Creare il Progetto su Railway

1. Vai su https://railway.app e accedi con GitHub
2. Clicca **"New Project"**
3. Seleziona **"Deploy from GitHub repo"**
4. Autorizza Railway ad accedere al tuo repository
5. Seleziona il repository `Tennis`

### Step 1.3: Configurare il Backend

1. Railway rileverà automaticamente la cartella. Clicca sui tre puntini del servizio creato
2. Vai su **Settings** > **Root Directory** e imposta: `backend`
3. Railway userà il Dockerfile automaticamente

### Step 1.4: Aggiungere il Database PostgreSQL

1. Nel progetto Railway, clicca **"+ New"** > **"Database"** > **"PostgreSQL"**
2. Railway creerà automaticamente il database e le variabili d'ambiente

### Step 1.5: Collegare Backend al Database

1. Clicca sul servizio backend
2. Vai su **Variables**
3. Aggiungi le seguenti variabili:

```
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=tua-chiave-segreta-molto-lunga-almeno-64-caratteri-per-sicurezza
CORS_ORIGINS=https://tuo-sito.netlify.app
FRONTEND_URL=https://tuo-sito.netlify.app
```

4. Railway collega automaticamente le variabili del database (PGHOST, PGPORT, etc.)

### Step 1.6: Deploy del Backend

1. Clicca **"Deploy"** o attendi il deploy automatico
2. Una volta completato, vai su **Settings** > **Networking** > **Generate Domain**
3. Copia l'URL generato (es: `tennis-backend-production.up.railway.app`)

---

## PARTE 2: Deploy del Frontend su Netlify

### Step 2.1: Aggiornare la Configurazione

Prima di deployare, aggiorna l'URL del backend nel file `netlify.toml`:

1. Apri `frontend/netlify.toml`
2. Sostituisci `YOUR_BACKEND_URL` con l'URL Railway del backend:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://tennis-backend-production.up.railway.app/api/:splat"
  status = 200
  force = true
```

3. Committa e pusha le modifiche:

```bash
git add frontend/netlify.toml
git commit -m "Update backend URL for production"
git push origin master
```

### Step 2.2: Creare il Sito su Netlify

1. Vai su https://app.netlify.com
2. Clicca **"Add new site"** > **"Import an existing project"**
3. Seleziona **GitHub** e autorizza Netlify
4. Seleziona il repository `Tennis`

### Step 2.3: Configurare il Build

Netlify dovrebbe rilevare automaticamente le impostazioni dal `netlify.toml`. Verifica:

- **Base directory**: `frontend`
- **Build command**: `npm install --legacy-peer-deps && npm run build -- --configuration=production`
- **Publish directory**: `frontend/dist/tennis-club-frontend/browser`

### Step 2.4: Deploy

1. Clicca **"Deploy site"**
2. Attendi il completamento (circa 2-3 minuti)
3. Netlify genererà un URL (es: `random-name-123456.netlify.app`)

### Step 2.5: Personalizzare il Dominio (Opzionale)

1. Vai su **Site settings** > **Domain management**
2. Clicca **"Add custom domain"** o modifica il nome del sito
3. Puoi cambiare `random-name-123456` in qualcosa come `tennis-club-app`

---

## PARTE 3: Configurazione Finale

### Step 3.1: Aggiornare CORS su Railway

Ora che hai l'URL Netlify definitivo, aggiorna le variabili su Railway:

1. Vai al progetto Railway > Backend > Variables
2. Aggiorna:

```
CORS_ORIGINS=https://tennis-club-app.netlify.app
FRONTEND_URL=https://tennis-club-app.netlify.app
```

3. Railway farà automaticamente il redeploy

### Step 3.2: Verificare il Funzionamento

1. Apri l'URL Netlify nel browser
2. Verifica che la homepage carichi correttamente
3. Prova a registrarti e fare login
4. Verifica che i campi da tennis vengano caricati

---

## Configurazione Email (Opzionale)

Per abilitare la verifica email, configura un server SMTP su Railway:

### Opzione A: Gmail

1. Crea una "App Password" su Google (richiede 2FA abilitata)
2. Aggiungi su Railway:

```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tuaemail@gmail.com
MAIL_PASSWORD=la-tua-app-password
MAIL_FROM=tuaemail@gmail.com
```

### Opzione B: Resend (Consigliato per produzione)

1. Registrati su https://resend.com (gratuito fino a 3000 email/mese)
2. Crea un'API key
3. Aggiungi su Railway:

```
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=la-tua-api-key
MAIL_FROM=noreply@tuodominio.com
```

---

## Troubleshooting

### Il frontend non si connette al backend

1. Verifica che l'URL in `netlify.toml` sia corretto
2. Controlla i log di Netlify per errori di redirect
3. Verifica che CORS_ORIGINS su Railway includa l'URL Netlify

### Errore "Application failed to start" su Railway

1. Controlla i log: Railway > Backend > Deployments > View Logs
2. Verifica che le variabili d'ambiente siano configurate
3. Assicurati che il database sia collegato correttamente

### Il database non si connette

1. Verifica che PostgreSQL sia running su Railway
2. Clicca sul database > Connect > Copy le variabili
3. Assicurati che il backend le veda (controlla Variables)

### Build fallito su Netlify

1. Controlla i log di build su Netlify
2. Verifica che `package.json` sia nella cartella `frontend`
3. Prova a buildare localmente: `npm run build -- --configuration=production`

---

## Costi

### Railway (Backend + Database)
- **Free tier**: $5/mese di crediti gratuiti
- Sufficiente per progetti piccoli/demo
- Il servizio va in "sleep" dopo 10 minuti di inattività (si risveglia automaticamente)

### Netlify (Frontend)
- **Free tier**: 100GB bandwidth/mese, 300 build minutes/mese
- Sufficiente per la maggior parte dei progetti
- HTTPS gratuito incluso

---

## Comandi Utili

### Vedere i log del backend su Railway
```bash
# Installa Railway CLI
npm install -g @railway/cli

# Login
railway login

# Collega al progetto
railway link

# Vedi i log
railway logs
```

### Redeploy manuale
- **Railway**: Vai su Deployments > Redeploy
- **Netlify**: Vai su Deploys > Trigger deploy

---

## Architettura Finale

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│     Browser     │────▶│    Netlify      │────▶│    Railway      │
│                 │     │   (Frontend)    │     │   (Backend)     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │                 │
                                                │   PostgreSQL    │
                                                │   (Railway)     │
                                                │                 │
                                                └─────────────────┘
```

Le chiamate API dal frontend (`/api/*`) vengono automaticamente proxate da Netlify verso Railway, evitando problemi CORS.
