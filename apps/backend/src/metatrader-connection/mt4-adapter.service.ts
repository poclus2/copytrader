import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';

@Injectable()
export class MT4ConnectionAdapter {
    private readonly logger = new Logger(MT4ConnectionAdapter.name);

    async verify(credentials: any): Promise<any> {
        const { host, port } = credentials;

        if (!host || !port) {
            return { success: false, error: 'Host and port are required for MT4' };
        }

        return new Promise((resolve) => {
            const socket = new net.Socket();
            let statusResolved = false;

            const resolveStatus = (result: any) => {
                if (!statusResolved) {
                    statusResolved = true;
                    socket.destroy();
                    resolve(result);
                }
            };

            socket.setTimeout(5000); // 5s timeout

            socket.connect(Number(port), host, () => {
                this.logger.log(`Connected to MT4 server ${host}:${port}`);
                // Connection successful means server is reachable.
                // Note: Balance/equity not available via TCP-only connection

                resolveStatus({
                    success: true,
                    balance: 0, // Not available via TCP
                    equity: 0,  // Not available via TCP
                    note: 'Server reachable. Full authentication requires MT4 Manager API.'
                });
            });

            socket.on('error', (err: any) => {
                this.logger.warn(`MT4 connection error to ${host}:${port} - ${err.message}`);
                if (err.code === 'ECONNREFUSED') {
                    resolveStatus({ success: false, error: 'Connection refused' });
                } else if (err.code === 'ENOTFOUND') {
                    resolveStatus({ success: false, error: 'Host not found' });
                } else {
                    resolveStatus({ success: false, error: err.message });
                }
            });

            socket.on('timeout', () => {
                this.logger.warn(`MT4 connection timeout to ${host}:${port}`);
                resolveStatus({ success: false, error: 'Connection timeout' });
            });
        });
    }
}
