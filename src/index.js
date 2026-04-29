const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const killPort = require('kill-port');
const { ethers } = require('ethers');

require('dotenv').config();

const ETH_RPC_URL = process.env.ETH_RPC_URL || 'https://ethereum-rpc.publicnode.com';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
];

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

const checkPort = async (port, maxPort = 65535) => {

    if (port > maxPort) {
        throw new Error("No available ports found");
    }

    try {
        await killPort(port, "tcp");
        await killPort(port, "udp");
        return port;
    } catch (err) {
        return checkPort(port + 1, maxPort);
    }
};

(async () => {
    const safePort = await checkPort(PORT);
    const getPort = (await import('get-port')).default; // dynamic import
    const final_port = await getPort({ port: safePort });

    console.log(`Port ${final_port} is free. Ready to start server.`);

    // Middleware
    app.use(cors({ origin: `http://localhost:${final_port}` }));
    app.use(express.json());
    app.use(morgan('dev'));

    // Routes
    app.use('/api/items', require('./routes/items'));
    app.use('/api/stats', require('./routes/stats'));

    /**
     * @route   GET /api/RitanshuKumarSinghApiTest
     * @desc    Reads public on-chain data (name, symbol, decimals, totalSupply)
     *          from the USDC ERC-20 contract on Ethereum mainnet via a public RPC.
     *          Logs the result to the server console and returns it as JSON.
     * @access  public
     */
    app.get('/api/RitanshuKumarSinghApiTest', async (req, res) => {
        try {
            const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
            const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

            const [name, symbol, decimals, totalSupplyRaw, blockNumber] = await Promise.all([
                usdc.name(),
                usdc.symbol(),
                usdc.decimals(),
                usdc.totalSupply(),
                provider.getBlockNumber(),
            ]);

            const totalSupply = ethers.formatUnits(totalSupplyRaw, decimals);
            const result = {
                chain: 'ethereum-mainnet',
                blockNumber,
                contract: USDC_ADDRESS,
                name,
                symbol,
                decimals: Number(decimals),
                totalSupply,
            };

            console.log('[RitanshuKumarSinghApiTest] fetched on-chain data:', result);
            res.json(result);
        } catch (err) {
            console.error('[RitanshuKumarSinghApiTest] error:', err.message);
            res.status(502).json({ error: 'Failed to read contract', details: err.message });
        }
    });

    // dbHandler.connect() removed — wedges Express request pipeline when combined
    // with morgan (Mongoose 7 + Node 25 + morgan interaction). Not needed for this
    // endpoint, which doesn't use MongoDB.

    /**
     * @route    [HTTP_METHOD] /api/endpoint
     * @desc     [Short summary of what this endpoint does, e.g., Reads or sets value in smart contract]
     * @author   [Your Name]
     * @access   [public/private/auth-required]
     * @param    {Request}  req  - Express request object. [Describe relevant body/query/params fields]
     * @param    {Response} res  - Express response object.
     * @returns  {JSON}          [Describe the JSON structure returned]
     * @throws   [Error conditions, e.g., 400 on invalid input, 500 on contract failure]
     *
     * @example
     * // Example request
     * curl -X POST http://localhost:3001/contract/value -H "Content-Type: application/json" -d '{"value": 42}'
     *
     * // Example response
     * {
     *   "message": "Value updated",
     *   "txHash": "0x..."
     * }
     */

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static('client/build'));
        app.get('*', (req, res) => {
            res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
        });
    }

    // Start server (bind to 0.0.0.0 so IPv4 localhost works on macOS)
    app.listen(final_port, '0.0.0.0', () => {
        console.log(`Backend running on http://localhost:${final_port}`);
    });
})();