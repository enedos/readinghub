#!/bin/bash
echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║          READINGHUB  v1.0.0                ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# Check node
if ! command -v node &> /dev/null; then
    echo "  ✗ Node.js no está instalado."
    echo "  → Descargalo en https://nodejs.org"
    exit 1
fi

# Install server deps if needed
if [ ! -d "server/node_modules" ]; then
    echo "  Instalando dependencias del servidor..."
    npm install --prefix server
fi

# Build client if missing (fresh clone from GitHub won't have client/dist)
if [ ! -d "client/dist" ]; then
    if [ ! -d "client/node_modules" ]; then
        echo "  Instalando dependencias del cliente (primera vez, puede tardar un minuto)..."
        npm install --prefix client --legacy-peer-deps
    fi
    echo "  Compilando el cliente..."
    npm run build --prefix client
fi

echo "  Iniciando ReadingHub..."
echo "  → Abrí http://localhost:3001 en tu navegador"
echo ""

node server/index.js
