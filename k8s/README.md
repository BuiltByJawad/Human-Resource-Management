# Kubernetes Deployment Guide

## Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- NGINX Ingress Controller installed
- cert-manager for TLS (optional but recommended)

## Quick Start

### 1. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Create Secrets

```bash
# Copy and edit secrets
cp k8s/secrets.yaml.example k8s/secrets.yaml

# Generate strong secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET
openssl rand -hex 16  # For ENCRYPTION_KEY

# Edit secrets.yaml with your values
nano k8s/secrets.yaml

# Apply secrets
kubectl apply -f k8s/secrets.yaml
```

### 3. Apply ConfigMap

```bash
kubectl apply -f k8s/configmap.yaml
```

### 4. Deploy Database

```bash
kubectl apply -f k8s/postgres/
```

### 5. Deploy Redis

```bash
kubectl apply -f k8s/redis/
```

### 6. Deploy Backend

```bash
kubectl apply -f k8s/backend/
```

### 7. Deploy Frontend

```bash
kubectl apply -f k8s/frontend/
```

### 8. Setup Ingress

```bash
# Update domain names in k8s/ingress/ingress.yaml
kubectl apply -f k8s/ingress/
```

## Verify Deployment

```bash
# Check all pods
kubectl get pods -n hrm-system

# Check services
kubectl get svc -n hrm-system

# Check ingress
kubectl get ingress -n hrm-system

# View logs
kubectl logs -n hrm-system -l app=backend --tail=100

# Check HPA status
kubectl get hpa -n hrm-system
```

## Scaling

```bash
# Manual scale
kubectl scale deployment backend -n hrm-system --replicas=5

# HPA will auto-scale between 3-10 replicas based on CPU/memory
```

## Updates/Rollouts

```bash
# Update image
kubectl set image deployment/backend backend=ghcr.io/org/hrm-backend:v1.2.0 -n hrm-system

# Check rollout status
kubectl rollout status deployment/backend -n hrm-system

# Rollback if needed
kubectl rollout undo deployment/backend -n hrm-system
```

## Monitoring

```bash
# Access Prometheus metrics
kubectl port-forward -n hrm-system svc/backend 5000:5000
# Visit: http://localhost:5000/metrics

# Access Grafana
kubectl port-forward -n hrm-system svc/grafana 3000:3000
# Visit: http://localhost:3000
```

## Troubleshooting

### Pod not starting

```bash
kubectl describe pod <pod-name> -n hrm-system
kubectl logs <pod-name> -n hrm-system
```

### Database connection issues

```bash
kubectl exec -it postgres-0 -n hrm-system -- psql -U hrm_user -d hrm_db
```

### Redis connection issues

```bash
kubectl exec -it <redis-pod> -n hrm-system -- redis-cli ping
```

## Production Checklist

- [ ] Update all domain names in ingress.yaml
- [ ] Generate and set strong secrets
- [ ] Configure TLS certificates
- [ ] Set appropriate resource limits
- [ ] Configure backup strategy for PostgreSQL
- [ ] Setup monitoring alerts
- [ ] Test auto-scaling
- [ ] Test rolling updates
- [ ] Configure log aggregation
- [ ] Setup disaster recovery plan
