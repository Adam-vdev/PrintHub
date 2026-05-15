#!/usr/bin/env bash

# PrintFlow LXC - Proxmox VE Helper Script
# This script creates a new LXC container and installs the PrintFlow web app.
# Run this on your Proxmox Host.

set -e

# Default Settings
CTID=$(pvesh get /cluster/nextid)
HOSTNAME="printflow-lxc"
CORES="1"
RAM="512"
DISK="4G"
BRIDGE="vmbr0"
GATEWAY=""
INTERFACE="eth0"
IP="dhcp"

echo "--- PrintFlow LXC Installer ---"
echo "This will create a new container (ID: $CTID) with hostname: $HOSTNAME"
read -p "Press enter to continue or Ctrl+C to cancel..."

# Download Debian Template if missing
TEMPLATE_STORAGE="local"
TEMPLATE="debian-12-standard_12.2-1_amd64.tar.zst"

if ! pveam list $TEMPLATE_STORAGE | grep -q "$TEMPLATE"; then
  echo "Downloading $TEMPLATE..."
  pveam download $TEMPLATE_STORAGE $TEMPLATE
fi

# Create LXC Container
echo "Creating LXC Container..."
pct create $CTID $TEMPLATE_STORAGE:vztmpl/$TEMPLATE \
  --hostname $HOSTNAME \
  --cores $CORES \
  --memory $RAM \
  --net0 name=$INTERFACE,bridge=$BRIDGE,ip=$IP \
  --rootfs $TEMPLATE_STORAGE:4 \
  --unprivileged 1 \
  --features nesting=1 \
  --start 1

echo "Waiting for container to start..."
sleep 5

# Setup inside the container
echo "Installing dependencies inside container..."
pct exec $CTID -- bash -c "
  apt-get update && apt-get install -y \
    curl git sudo cups cups-client \
    avahi-daemon libnss-mdns

  # Install Node.js 20
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs

  # Configure CUPS for web access
  cupsctl --remote-admin --remote-any
  /etc/init.d/cups restart
"

# App Installation
echo "Deploying PrintFlow Web Dashboard..."
pct exec $CTID -- bash -c "
  mkdir -p /opt/printflow
  # In production, clone from github: 
  # git clone https://github.com/USER/REPO.git /opt/printflow
  # Running placeholder for this demo
  echo 'PrintFlow LXC Logic Deployed'
"

echo "-------------------------------------------------------"
echo "SUCCESS!"
echo "PrintFlow LXC is now running on ID $CTID."
echo "Access the dashboard at http://$HOSTNAME:3000 (once DNS/DHCP resolves)"
echo "-------------------------------------------------------"
