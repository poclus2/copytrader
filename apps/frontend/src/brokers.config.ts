export interface BrokerServer {
    name: string;
    address: string;
    type: 'demo' | 'live';
}

export interface Broker {
    id: string;
    name: string;
    platforms: ('mt4' | 'mt5')[];
    servers: BrokerServer[];
}

export const BROKERS: Broker[] = [
    {
        id: 'ic-markets',
        name: 'IC Markets',
        platforms: ['mt4', 'mt5'],
        servers: [
            { name: 'ICMarketsSC-Live01', address: 'mt4-live01.icmarkets.com:443', type: 'live' },
            { name: 'ICMarketsSC-Live02', address: 'mt4-live02.icmarkets.com:443', type: 'live' },
            { name: 'ICMarketsSC-Demo', address: 'mt4-demo.icmarkets.com:443', type: 'demo' },
        ],
    },
    {
        id: 'exness',
        name: 'Exness',
        platforms: ['mt4', 'mt5'],
        servers: [
            { name: 'Exness-Real', address: 'mt4real.exness.com:443', type: 'live' },
            { name: 'Exness-Real2', address: 'mt4real2.exness.com:443', type: 'live' },
            { name: 'Exness-Demo', address: 'mt4demo.exness.com:443', type: 'demo' },
        ],
    },
    {
        id: 'pepperstone',
        name: 'Pepperstone',
        platforms: ['mt4', 'mt5'],
        servers: [
            { name: 'Pepperstone-Live01', address: 'edge.pepperstone.com:443', type: 'live' },
            { name: 'Pepperstone-Demo', address: 'demo.pepperstone.com:443', type: 'demo' },
        ],
    },
    {
        id: 'roboforex',
        name: 'RoboForex',
        platforms: ['mt4', 'mt5'],
        servers: [
            { name: 'RoboForex-ECN', address: 'ecn.roboforex.com:443', type: 'live' },
            { name: 'RoboForex-ProCent', address: 'procent.roboforex.com:443', type: 'live' },
            { name: 'RoboForex-Demo', address: 'demo.roboforex.com:443', type: 'demo' },
        ],
    },
    {
        id: 'fxtm',
        name: 'FXTM (ForexTime)',
        platforms: ['mt4', 'mt5'],
        servers: [
            { name: 'FXTM-Live-ECN-1', address: 'dc1.mt4ecn.forextime.com:443', type: 'live' },
            { name: 'FXTM-Live-ECN-2', address: 'dc2.mt4ecn.forextime.com:443', type: 'live' },
            { name: 'ForexTimeFXTM-Live01', address: 'dc1.mt5-live01.forextime.com:443', type: 'live' },
            { name: 'ForexTimeFXTM-Demo01', address: 'dc1.mt5-demo01.forextime.com:443', type: 'demo' },
            { name: 'ForexTimeFXTM-Demo02', address: 'dc2.mt5-demo01.forextime.com:443', type: 'demo' },
        ],
    },
    {
        id: 'xm',
        name: 'XM',
        platforms: ['mt4', 'mt5'],
        servers: [
            { name: 'XM-Real1', address: 'xmglobal.com:443', type: 'live' },
            { name: 'XM-Real2', address: 'xm-global2.com:443', type: 'live' },
            { name: 'XM-Demo', address: 'xmdemo.com:443', type: 'demo' },
        ],
    },
    {
        id: 'metaquotes',
        name: 'MetaQuotes Demo',
        platforms: ['mt5'],
        servers: [
            { name: 'MetaQuotes-Demo', address: 'demo.metaquotes.net:443', type: 'demo' },
        ],
    },
    {
        id: 'custom',
        name: 'Custom Broker',
        platforms: ['mt4', 'mt5'],
        servers: [],
    },
];
