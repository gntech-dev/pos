# POS System - Deployment Options

## Quick Start

Choose the deployment method that best suits your needs:

### Option 1: Manual Deployment (Recommended for GitHub)
📋 **Follow**: [`MANUAL_DEPLOYMENT_GUIDE.md`](MANUAL_DEPLOYMENT_GUIDE.md)
- Step-by-step instructions
- No automated scripts required
- Perfect for GitHub repositories
- Full control over each step

### Option 2: Automated Deployment
🚀 **Use**: [`deploy.sh`](deploy.sh)
- One-command deployment
- Automated setup and configuration
- Includes SSL certificate setup
- Best for quick deployments

### Option 3: Detailed Installation Guide
📖 **Read**: [`INSTALLATION_GUIDE.md`](INSTALLATION_GUIDE.md)
- Comprehensive installation procedures
- Advanced configuration options
- Production deployment best practices

## Documentation Overview

| Document | Purpose | Best For |
|----------|---------|----------|
| [`TESTING_DOCUMENTATION.md`](TESTING_DOCUMENTATION.md) | Complete testing procedures | QA and validation |
| [`MANUAL_DEPLOYMENT_GUIDE.md`](MANUAL_DEPLOYMENT_GUIDE.md) | Step-by-step manual deployment | GitHub repositories |
| [`INSTALLATION_GUIDE.md`](INSTALLATION_GUIDE.md) | Detailed installation guide | Complex setups |
| [`SERVER_DEPLOYMENT_SUMMARY.md`](SERVER_DEPLOYMENT_SUMMARY.md) | Overview and quick reference | Project overview |

## System Requirements

- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Node.js**: 18.0+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB free space
- **Network**: Stable internet connection

## Default Access

- **URL**: http://localhost:3000 (development)
- **Admin User**: username=`admin`, password=`admin123`

⚠️ **Important**: Change default password immediately after deployment!

## Support

- Check troubleshooting sections in each guide
- Review logs: `pm2 logs pos-system`
- Application status: `pm2 status`

---

**Ready to deploy?** Start with [`MANUAL_DEPLOYMENT_GUIDE.md`](MANUAL_DEPLOYMENT_GUIDE.md) for the cleanest GitHub-ready experience.