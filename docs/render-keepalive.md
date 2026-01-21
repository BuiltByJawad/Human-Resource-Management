# Render Free Tier: Sleep/Cold Start & WebSocket Drop Mitigation

Render free services sleep after inactivity. This causes cold starts and can drop WebSocket connections. The best free-tier mitigation is a lightweight **keep-alive ping** plus a **reconnect strategy** on the client. This document adds a safe, non-invasive approach without touching app code.

## ✅ What This Solves

- **Sleep / cold starts**: ping keeps the service warm.
- **WebSocket drops**: keep-alive reduces sleep-triggered disconnects, and reconnect logic can be configured in your client (if needed).

> Note: Free tiers still have limits. For persistent WebSocket uptime, paid tiers or a host with free “always on” is more reliable.

---

## Option A: Free Uptime Robot (No Code Changes)

1. Create an UptimeRobot account (free plan).
2. Add a **HTTP(s) Monitor**.
3. Set the URL to your backend health endpoint:
   - `https://<your-backend>.onrender.com/health/live`
4. Set interval to **1 minute**.

This keeps the backend warm and minimizes cold starts.

---

## Option B: GitHub Actions Keep-Alive (No Code Changes)

Create a workflow in your repo (example below). This triggers every 5 minutes.

**File**: `.github/workflows/render-keepalive.yml`

```yaml
name: Keep Render Awake

on:
  schedule:
    - cron: "* * * * *"

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Render backend
        run: |
          curl -sS -o /dev/null -w "%{http_code}" "${{ secrets.RENDER_BACKEND_URL }}/health/live"
```

**Secrets required**:
- `RENDER_BACKEND_URL` → `https://<your-backend>.onrender.com`

---

## Option C: External Ping Service

Use any external uptime service to hit:
```
https://<your-backend>.onrender.com/health/live
```

---

## WebSocket Drops (Notes)

Render free tier can sleep; this can disconnect Socket.IO.

Mitigations:
- Keep-alive ping as above.
- Ensure the client reconnects automatically (Socket.IO does this by default).
- If you need **always-on WebSockets**, use paid Render or move backend to:
  - **Fly.io** (free allowance)
  - **Railway** (free trial credits)

---

## Recommended Health Endpoint

Your backend already exposes:
- `/health/live` (see backend app health routes)

Use it for keep-alive pings.
