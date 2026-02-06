# Tennis Club - Applicazione Web

Applicazione web completa per la gestione di un circolo tennis/padel con sistema di prenotazione campi, gestione utenti e pannello amministrativo.

## Stack tecnologico

- **Backend:** Java 21, Spring Boot 3.2, Spring Security, Spring Data JPA
- **Frontend:** Angular 19, TypeScript (strict mode), PrimeNG
- **Database:** PostgreSQL 16
- **Containerizzazione:** Docker + Docker Compose

## Requisiti

- Docker e Docker Compose
- Oppure, per sviluppo locale:
  - Java 21 (JDK)
  - Node.js 20+
  - Maven 3.9+
  - PostgreSQL 16

## Avvio rapido con Docker

```bash
# Dalla root del progetto
docker-compose up --build
```

I servizi saranno disponibili su:

| Servizio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| pgAdmin | http://localhost:5050 |

### Credenziali predefinite

- **Admin:** admin@tennisclub.it / Admin123!
- **pgAdmin:** admin@tennis.club / admin
- **Database:** tcuser / tcpass

## Sviluppo locale (senza Docker)

### 1. Database

Avviare PostgreSQL e creare il database:

```sql
CREATE DATABASE tennisclub;
CREATE USER tcuser WITH PASSWORD 'tcpass';
GRANT ALL PRIVILEGES ON DATABASE tennisclub TO tcuser;
```

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run
```

Il backend si avvia su http://localhost:8080. Flyway crea automaticamente le tabelle e i dati iniziali.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Il frontend si avvia su http://localhost:4200.

## Struttura del progetto

```
Tennis/
  backend/                  # Spring Boot API
    src/main/java/com/tennisclub/
      auth/                 # JWT, filtri, UserDetails
      config/               # Security, CORS, JPA, Web
      controller/           # REST controller
      dto/                  # Request/Response DTO
      exception/            # Gestione errori centralizzata
      model/                # Entita JPA
      repository/           # Spring Data repositories
      service/              # Logica di business
      util/                 # Costanti
    src/main/resources/
      db/migration/         # Migrazioni Flyway
      application.properties
  frontend/                 # Angular 19 SPA
    src/app/
      core/                 # Servizi, modelli, interceptor, guard
      shared/               # Header, footer, componenti condivisi
      features/
        public/             # Home, campi, chi siamo, contatti
        auth/               # Login, registrazione, reset password
        booking/            # Prenotazione campi con calendario
        dashboard/          # Dashboard utente (profilo, prenotazioni)
        admin/              # Pannello admin completo
  docker-compose.yml
```

## Ruoli utente

| Ruolo | Descrizione |
|-------|-------------|
| ROLE_USER | Utente standard: prenota campi a tariffa base, gestisce le proprie prenotazioni |
| ROLE_MEMBER | Socio: tutte le funzioni utente + tariffa agevolata sui campi |
| ROLE_ADMIN | Amministratore: gestione completa di campi, prenotazioni, utenti, contenuti del sito |

## Funzionalita principali

### Area pubblica
- Home page con contenuti dinamici
- Catalogo campi con foto e filtri per tipo (tennis/padel)
- Dettaglio campo con galleria fotografica
- Pagina Chi Siamo e Contatti con form

### Prenotazioni
- Calendario giornaliero con slot orari
- Visualizzazione disponibilita in tempo reale
- Calcolo prezzo automatico in base al ruolo
- Cancellazione con limite temporale configurabile
- Limite prenotazioni future per utente

### Dashboard utente
- Profilo con modifica username e password
- Storico prenotazioni con filtri e cancellazione

### Pannello admin
- Statistiche con grafici (prenotazioni, ricavi, utilizzo campi)
- CRUD campi con gestione foto (upload/riordino)
- Gestione prenotazioni con filtri e export CSV
- Gestione utenti con cambio ruolo e sospensione
- Editor contenuti pagine vetrina (con anteprima live)
- Gestione informazioni di contatto

## API Endpoints principali

### Autenticazione
- `POST /api/auth/register` - Registrazione
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Richiesta reset password
- `POST /api/auth/reset-password` - Reset password

### Campi (pubblico)
- `GET /api/public/courts` - Lista campi attivi
- `GET /api/public/courts/{id}` - Dettaglio campo
- `GET /api/public/courts/{id}/schedule?date=` - Programma giornaliero
- `GET /api/public/courts/{id}/week-schedule?startDate=` - Programma settimanale

### Prenotazioni (autenticato)
- `POST /api/reservations` - Crea prenotazione
- `DELETE /api/reservations/{id}` - Cancella prenotazione
- `GET /api/reservations/me` - Le mie prenotazioni

### Admin
- `GET/POST/PUT/DELETE /api/admin/courts` - Gestione campi
- `GET /api/admin/reservations` - Tutte le prenotazioni
- `GET /api/admin/users` - Gestione utenti
- `PUT /api/admin/pages/{slug}` - Modifica pagine
- `PUT /api/admin/contact` - Modifica contatti
- `GET /api/admin/dashboard/stats` - Statistiche

## Configurazione

Le principali impostazioni sono in `backend/src/main/resources/application.properties`:

| Proprieta | Descrizione | Default |
|-----------|-------------|---------|
| app.club.max-future-reservations | Max prenotazioni future per utente | 5 |
| app.club.cancellation-deadline-hours | Ore minime prima per cancellare | 2 |
| app.jwt.access-token-expiration-ms | Durata access token (ms) | 900000 (15 min) |
| app.jwt.refresh-token-expiration-ms | Durata refresh token (ms) | 604800000 (7 giorni) |
| app.upload.dir | Directory upload foto | ./uploads |

## Sicurezza

- Password hashate con BCrypt
- JWT con Access Token (15 min) + Refresh Token (7 giorni)
- CORS configurato
- Rate limiting su login e reset password
- Sanitizzazione HTML (Jsoup) per contenuti CMS
- Validazione file upload (estensione, dimensione)
- Gestione errori centralizzata senza esposizione stack trace
