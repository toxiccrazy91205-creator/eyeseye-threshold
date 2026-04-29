# Full Step-by-Step Deployment Guide: AWS EC2

This guide provides a comprehensive, step-by-step walkthrough for deploying the EyesEye MERN project to an AWS EC2 instance using Docker.

---

## Phase 1: AWS EC2 Setup

### 1. Launch Instance
- **AMI**: Ubuntu 22.04 LTS.
- **Instance Type**: t2.micro (Free Tier) is sufficient for testing.
- **Key Pair**: Create and download your `.pem` file.

### 2. Configure Security Group
In the AWS Console, edit your Security Group's **Inbound Rules**:
| Protocol | Port Range | Source | Description |
|----------|------------|--------|-------------|
| SSH      | 22         | My IP  | Secure access |
| HTTP     | 80         | 0.0.0.0/0 | Web traffic (Frontend) |
| Custom   | 5000       | 0.0.0.0/0 | API traffic (Backend) |

---

## Phase 2: Server Preparation

### 3. Connect to EC2
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

> [!TIP]
> **Can't connect? Check these 3 things:**
> 1. **Security Group**: In the AWS Console, ensure port 22 is open for your IP.
> 2. **Key Permissions (Windows)**: If you get a "permissions are too open" error, right-click your `.pem` file -> Properties -> Security -> Advanced -> Disable Inheritance -> Remove all. Then add your user with "Full Control".
> 3. **Public IP**: Make sure you are using the **Public IPv4 address**, not the private one.

### 4. Install Docker & Docker Compose
Run these commands sequentially:
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group (fixes permission issues)
sudo usermod -aG docker $USER
```
**CRITICAL**: After the last command, exit the SSH session and log back in for changes to take effect.

---

## Phase 3: Project Deployment

### 5. Clone the Repository
```bash
git clone https://github.com/toxiccrazy91205-creator/eyeseye-threshold.git
cd eyeseye-threshold
```
> [!NOTE]
> If you get "Permission denied" errors, run this to take ownership: `sudo chown -R $USER:$USER .`

### 6. Configure Environment Variables
Create a root `.env` file to hold your production secrets:
```bash
sudo nano .env
```
Paste your MongoDB URI (and any other secrets):
```env
MONGODB_URI=mongodb+srv://devparmar9122005_db_user:iyTOOQzW5dSPZfEI@ac-t5zuodj-shard-00-00.bdsq4tn.mongodb.net/eyeseye?retryWrites=true&w=majority
```
*Press `Ctrl+O`, `Enter`, then `Ctrl+X` to save and exit.*

### 7. Build and Start with Docker
```bash
docker-compose up -d --build
```

---

## Phase 4: Verification & Troubleshooting

### 8. Check Running Containers
```bash
docker ps
```
You should see two containers running: `eyeseye-threshold-client` and `eyeseye-threshold-server`.

### 9. Access the App
- **Frontend**: Open `http://your-ec2-public-ip` in your browser.
- **Backend API**: Check `http://your-ec2-public-ip:5000/api/health`.

### 10. Viewing Logs
If something isn't working, check the logs:
```bash
docker-compose logs -f server
```

---

## Phase 5: Production Best Practices (Optional)

### SSL/HTTPS (Certbot)
To enable HTTPS, you should install Nginx on the host machine and use Certbot:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```
Then configure Nginx as a reverse proxy to forward traffic to port 80 (Docker).
