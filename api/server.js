const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

// Listen on the specific route you requested
app.use('/api/proxy', (req, res, next) => {
    // 1. Get the 'url' from the query string (?url=...)
    const targetUrlString = req.query.url;

    // If no URL is provided, return an error
    if (!targetUrlString) {
        return res.status(400).send('Error: Missing "url" query parameter.');
    }

    try {
        // 2. Parse the target URL
        const targetUrl = new URL(targetUrlString);

        // 3. Create the proxy middleware dynamically for this specific request
        const dynamicProxy = createProxyMiddleware({
            // Target the base domain (e.g., http://example.com)
            target: `${targetUrl.protocol}//${targetUrl.host}`,
            changeOrigin: true,
            
            // Rewrite the path to match the file requested in the target URL
            pathRewrite: () => {
                return targetUrl.pathname + targetUrl.search;
            },
            
            // Optional logs
            onProxyReq: () => {
                console.log(`[PROXY] Fetching: ${targetUrlString}`);
            },
            onError: (err, req, res) => {
                console.error(`[PROXY ERROR]`, err.message);
                res.status(500).send('Error reaching target server.');
            }
        });

        // 4. Run the proxy middleware
        return dynamicProxy(req, res, next);

    } catch (error) {
        // This catches malformed URLs (e.g., missing "http://")
        return res.status(400).send('Error: Invalid URL format.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Dynamic Proxy Server is running!`);
    console.log(`Test it here: http://localhost:${PORT}/api/proxy?url=http://example.com`);
});
