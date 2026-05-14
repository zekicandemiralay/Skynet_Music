# Skynet Music

A self-hosted music player for your local network. Stream your music library, download from YouTube, and listen offline — all from any device on your network.

## Features

- Stream your local music library (MP3, FLAC, WAV, OGG, M4A, OPUS, AAC)
- YouTube search and audio download (via yt-dlp)
- Offline listening — cache playlists to your device
- Per-user accounts with liked songs and playlists
- Personal listening stats (top songs, streaks, play history)
- HTTPS with auto-generated self-signed certificate (required for mobile offline mode)

## Requirements

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

That's it. Everything else (Node.js, nginx, ffmpeg, yt-dlp) runs inside containers.

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/zekicandemiralay/Skynet_Music.git
cd Skynet_Music
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and set these values:

```env
# Your server's local IP address
# Windows: run  ipconfig  and look for IPv4 Address
# Linux:   run  ip addr show
SERVER_IP=192.168.1.x

# Where your music files live
MUSIC_DIR=/path/to/your/music
```

The other values have sensible defaults. Change `JWT_SECRET` to a long random string in production.

### 3. Start the app

```bash
docker compose up -d
```

On first start the backend prints the admin password once:

```bash
docker compose logs backend
```

Look for a line like:

```
[auth] Generated admin password: xxxxxxxx
```

### 4. Open the app

```
https://YOUR_SERVER_IP:4000
```

Your browser will warn about the self-signed certificate — this is expected. Accept it (details below per device).

---

## Trusting the certificate on your devices

The app runs over HTTPS using a self-signed certificate. Browsers block self-signed certs by default. You need to install and trust the cert once per device.

### iPhone / iPad

1. Open Safari and go to `http://YOUR_SERVER_IP:8080/cert`
2. Tap **Allow** when asked to download a profile
3. Go to **Settings → General → VPN & Device Management**
4. Tap the **Skynet Music** profile → tap **Install** (top right) → enter your PIN → tap **Install** again
5. Go to **Settings → General → About → Certificate Trust Settings**
6. Toggle **Skynet Music** to **ON**
7. Open `https://YOUR_SERVER_IP:4000` in Safari — done

### Android (Chrome)

1. Open Chrome and go to `http://YOUR_SERVER_IP:8080/cert`
2. Download the file
3. Go to **Settings → Security → More security settings → Install a certificate → CA certificate**
4. Select the downloaded file and confirm
5. Open `https://YOUR_SERVER_IP:4000` in Chrome

### Mac (Safari / Chrome)

1. Go to `http://YOUR_SERVER_IP:8080/cert` and download the file
2. Double-click the downloaded `cert.pem` → Keychain Access opens
3. Find **Skynet Music** in the list → double-click it
4. Expand **Trust** → set **When using this certificate** to **Always Trust**
5. Close and enter your password to confirm

### Windows (Chrome / Edge)

1. Go to `http://YOUR_SERVER_IP:8080/cert` and download the file
2. Double-click `cert.pem` → click **Install Certificate**
3. Choose **Local Machine** → Next
4. Choose **Place all certificates in the following store** → Browse → select **Trusted Root Certification Authorities** → OK → Next → Finish
5. Restart the browser

### PC browser (quick bypass — no install)

On Chrome/Edge: click anywhere on the warning page and type `thisisunsafe` (no field, just type it). The page loads. Only do this on your own network.

---

## Offline listening

Once the cert is trusted and you've loaded the app over HTTPS at least once, the service worker caches the app shell. After that:

1. Open any playlist or the Library
2. Tap the **Save offline** button to download all songs in that view
3. Use the app normally — audio plays from local storage when the server is unreachable

---

## Configuration reference

| Variable | Default | Description |
|---|---|---|
| `SERVER_IP` | `127.0.0.1` | Server's LAN IP — goes into the TLS certificate SAN |
| `HTTP_PORT` | `8080` | Port for cert download (`http://IP:HTTP_PORT/cert`) |
| `HTTPS_PORT` | `4000` | Port for the main app (`https://IP:HTTPS_PORT`) |
| `MUSIC_DIR` | `./music` | Path to your music folder on the host |
| `JWT_SECRET` | *(insecure default)* | Secret for signing login tokens — change this |
| `ADMIN_USERNAME` | `admin` | Admin account username |
| `ADMIN_PASSWORD` | *(auto-generated)* | Set to override; otherwise printed once in logs |
| `SECURE_COOKIE` | `true` | Keep true — required for cookies over HTTPS |

---

## Updating

```bash
git pull
docker compose up --build -d
```

The TLS certificate and database are stored in Docker volumes and survive rebuilds.

## Ports used

| Port | Purpose |
|---|---|
| `8080` (HTTP) | Cert download only — everything else redirects to HTTPS |
| `4000` (HTTPS) | Main app |
| `3001` | Backend API (internal, not exposed to host) |
