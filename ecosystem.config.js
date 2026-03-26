export default {
  apps: [
    {
      name: "telegram-filter-bot",
      script: "src/main.js",
      interpreter: "node",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      merge_logs: true,
    },
  ],
};
