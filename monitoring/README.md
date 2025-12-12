# Monitoring Setup Guide

## Architecture

```
Application → Prometheus → Grafana
              ↓
          AlertManager → Slack/Email
```

## Quick Start

### 1. Using Docker Compose

```bash
cd monitoring
docker-compose up -d
```

This will start:
- Prometheus (http://localhost:9090)
- Grafana (http://localhost:3000)
- AlertManager (http://localhost:9093)

### 2. Access Grafana

- URL: http://localhost:3000
- Default login: admin/admin
- Import dashboard: `grafana/dashboards/hrm-overview.json`

### 3. Configure Data Source

1. Go to Configuration → Data Sources
2. Add Prometheus
3. URL: http://prometheus:9090
4. Click "Save & Test"

## Dashboards

### HRM Overview Dashboard

Displays:
- Request rate
- Error rate (4xx, 5xx)
- Response times (p50, p95)
- Active users
- Employee count
- Database metrics
- Login success/failure
- Memory usage

**Import:** `grafana/dashboards/hrm-overview.json`

### Custom Dashboards

Create your own:
1. Click "+" → Dashboard
2. Add Panel
3. Select Prometheus as data source
4. Write PromQL query
5. Save dashboard

## Available Metrics

### HTTP Metrics

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])

# Response time (95th percentile)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Database Metrics

```promql
# Query duration
histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))

# Active connections
db_connections_active
```

### Business Metrics

```promql
# Active users
active_users_total

# Employee count
employees_total

# Login attempts
rate(login_attempts_total{status="success"}[5m])
```

## Alerts

### Configured Alerts

1. **HighErrorRate** - API error rate > 5%
2. **HighResponseTime** - p95 latency > 2s
3. **DatabaseDown** - PostgreSQL offline
4. **SlowDatabaseQueries** - Queries > 1s
5. **HighFailedLogins** - Possible brute force

### Alert Destinations

Configure in `prometheus/alertmanager.yml`:

```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK'
        channel: '#alerts'
  
  - name: 'email'
    email_configs:
      - to: 'alerts@company.com'
```

## Prometheus Queries

### Top 10 Slowest Endpoints

```promql
topk(10, histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])))
```

### Request Rate by Endpoint

```promql
sum by (route) (rate(http_requests_total[5m]))
```

### Error Rate Percentage

```promql
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / 
sum(rate(http_requests_total[5m])) * 100
```

## Kubernetes Integration

If running in Kubernetes:

```yaml
# ServiceMonitor for automatic discovery
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: hrm-backend
spec:
  selector:
    matchLabels:
      app: backend
  endpoints:
  - port: http
    path: /metrics
```

## Grafana Variables

Use variables for dynamic dashboards:

1. **Environment:** `prod`, `staging`, `dev`
2. **Instance:** Backend pod names
3. **Time Range:** Custom time windows

## Best Practices

1. **Set retention:** Configure Prometheus retention period
2. **Use labels:** Tag metrics with meaningful labels
3. **Create alerts:** Don't just collect metrics, act on them
4. **Dashboard organization:** Group related metrics
5. **Regular review:** Check dashboards weekly

## Troubleshooting

### Prometheus not scraping

```bash
# Check targets
curl http://localhost:9090/api/v1/targets

# Check metrics endpoint
curl http://localhost:5000/metrics
```

### Grafana not showing data

1. Check data source connection
2. Verify Prometheus is running
3. Check time range selection
4. Inspect PromQL query

### Alerts not firing

1. Check alert rules: http://localhost:9090/alerts
2. Verify AlertManager config
3. Check notification channels

## Next Steps

1. Add custom business metrics
2. Create role-specific dashboards
3. Setup SLA monitoring
4. Configure long-term storage
5. Implement distributed tracing (Jaeger/Zipkin)
