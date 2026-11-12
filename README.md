# Student Management System (Microservices + Docker + Kubernetes)

Node.js/Express microservices with MySQL, deployed on Minikube.

| Service | Port | Role |
|---|---|---|
| api-gateway | 3000 | Single entry point, routes all requests |
| registration-service | 3001 | POST/GET/PUT students |
| delete-service | 3002 | DELETE students |
| mysql | 3306 | Database `college`, table `students` |

Pod 1 = api-gateway + registration-service. Pod 2 = delete-service.

## Run on Minikube
```bash
minikube start
eval $(minikube docker-env)          # Windows PowerShell: minikube docker-env | Invoke-Expression
docker build -t api-gateway:1.0 ./api-gateway
docker build -t registration-service:1.0 ./registration-service
docker build -t delete-service:1.0 ./delete-service

kubectl apply -f k8s/mysql.yaml
kubectl apply -f k8s/pod1-deployment.yaml
kubectl apply -f k8s/pod2-deployment.yaml
kubectl apply -f k8s/services.yaml
kubectl get pods

minikube service api-gateway-service --url   # use this URL in Postman
```

## API (all via gateway)
- POST   /students        `{ "student_name": "...", "student_mobile": "...", "student_email": "...", "student_password": "..." }`
- GET    /students
- GET    /students/:id
- PUT    /students/:id
- DELETE /students/:id
