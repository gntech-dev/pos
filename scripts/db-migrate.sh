#!/bin/bash
# Database migration wrapper script
# Ensures commands are run from the project root directory

# Get the directory where this script is located (project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to project root
cd "$SCRIPT_DIR"

# Run the prisma command
prisma migrate dev --schema=database/prisma/schema.prisma