export function buildHtmlResponse(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Argent AI Labs</title>
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .dashboard-header {
      margin-bottom: 40px;
    }
    .dashboard-header h1 {
      font-size: 2.5rem;
      margin-bottom: 8px;
    }
    .dashboard-info {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .dashboard-info p {
      margin: 8px 0;
      font-size: 1rem;
    }
    .dashboard-links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    .dashboard-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 24px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
    }
    .dashboard-card:hover {
      border-color: #333;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .dashboard-card h3 {
      margin: 0 0 8px 0;
      font-size: 1.25rem;
    }
    .dashboard-card p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }
    .logout-btn {
      background: #333;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .logout-btn:hover {
      background: #555;
    }
  </style>
</head>
<body>
  ${bodyContent}
  <script src="/js/auth.js" defer></script>
</body>
</html>`;
}
