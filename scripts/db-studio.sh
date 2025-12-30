#!/bin/bash
# Database studio wrapper script
# Ensures commands are run from the project root directory

# Get the directory where this script is located (project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to project root
cd "$SCRIPT_DIR"

# Run the prisma command
prisma studio --schema=database/prisma/schema.prisma