# AWS EC2 Deployment Guide

This guide explains how to deploy the EyesEye MERN project to an AWS EC2 instance using Docker and Docker Compose.

## 1. Prepare your EC2 Instance
1. Launch an EC2 Instance (Ubuntu 22.04 LTS recommended).
2. Ensure your **Security Group** allows inbound traffic on:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 5000 (Backend API - Optional if using Nginx as proxy)

## 2. Install Docker and Docker Compose
Connect to your instance via SSH and run:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```
*(Logout and log back in for group changes to take effect)*

## 3. Clone and Configure
1. Clone your repository to the EC2 instance.
2. Create a `.env` file in the root directory:
```bash
MONGODB_URI=mongodb://your_user:your_password@your_atlas_shard...
```

## 4. Build and Launch
From the project root:
```bash
docker-compose up -d --build
```

## 5. Verify
- Visit your EC2 Public IP in the browser.
- The frontend should be visible on port 80.
- The backend API should be accessible via `http://<EC2_IP>:5000/api`.

## 6. Important Notes
- **Vite Proxy**: The production build handles API calls via relative paths. If you use Nginx to serve the frontend, ensure it's configured to proxy `/api` requests to the `server` service.
- **SSL**: For production, it is highly recommended to use **Certbot (Let's Encrypt)** and configure an Nginx reverse proxy for HTTPS.
