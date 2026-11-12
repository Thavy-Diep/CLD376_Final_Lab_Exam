# Student Management System (Microservices + Docker + Kubernetes)

Node.js/Express microservices with MongoDB Atlas, deployed on Minikube.

| Service | Port | Role |
|---|---|---|
| api-gateway | 3000 | Single entry point, routes all requests |
| registration-service | 3001 | POST/GET/PUT students |
| delete-service | 3002 | DELETE students |
| MongoDB Atlas | 27017 | Database `college`, collection `students` |

Pod 1 = api-gateway + registration-service. Pod 2 = delete-service.

## Run on Minikube
```powershell
Set-Location "D:\New folder\student-management-system\student-management-system"
minikube start
minikube image build -t api-gateway:1.0 .\api-gateway
minikube image build -t registration-service:1.0 .\registration-service
minikube image build -t delete-service:1.0 .\delete-service

kubectl create secret generic mongodb-atlas --from-literal=connection-string="YOUR_ATLAS_URI"
kubectl apply -f .\k8s\pod1-deployment.yaml -f .\k8s\pod2-deployment.yaml -f .\k8s\services.yaml
kubectl get pods

minikube service api-gateway-service --url   # use this URL in Postman
```

In MongoDB Atlas, create a database user, allow your client IP (or configure network access for your Minikube environment), and copy the driver's connection string. Replace `YOUR_ATLAS_URI` with your actual URI; URL-encode special characters in the password. The `students` collection and unique email index are created by the services. Do not commit the URI or share it publicly.

After changing the Atlas URI, update the Kubernetes secret and restart both services:
```powershell
kubectl delete secret mongodb-atlas
kubectl create secret generic mongodb-atlas --from-literal=connection-string="YOUR_ATLAS_URI"
kubectl rollout restart deployment/pod1-gateway-registration deployment/pod2-delete
```

## API (all via gateway)
- POST   /students        `{ "student_name": "...", "student_mobile": "...", "student_email": "...", "student_password": "..." }`
- GET    /students
- GET    /students/:id
- PUT    /students/:id
- DELETE /students/:idOrName (numeric ID or exact non-numeric name)
- DELETE /students/name/:name (exact name, including numeric-only names)

Student IDs are assigned sequentially by the service (1, 2, 3, ...); do not include `Student_id` in the registration request. The response and student records include the assigned ID. If multiple students share a name, delete by ID instead.
