module.exports = {
  apps: [
    {
      name: 'pos-system',
      script: 'npm',
      args: 'start',
      cwd: process.cwd(),
      instances: 1, // Use 'max' for multiple instances, 1 for single instance
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      listen_timeout: 8000,
      shutdown_with_message: true,

      // Advanced configuration
      exp_backoff_restart_delay: 100,
      wait_ready: true,
      listen_timeout: 8000,

      // Logging configuration
      log_type: 'json',
      combine_logs: true,

      // Process management
      exec_mode: 'fork', // 'fork' or 'cluster'

      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_timeout: 5000
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'posuser',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/pos-system.git',
      path: '/home/gntech/pos',
      'post-deploy': 'cp ecosystem.config.example.js ecosystem.config.js && npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}