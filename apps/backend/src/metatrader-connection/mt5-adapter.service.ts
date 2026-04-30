import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class MT5ConnectionAdapter {
    private readonly logger = new Logger(MT5ConnectionAdapter.name);

    async verify(credentials: any): Promise<any> {
        return new Promise((resolve, reject) => {
            // Try to find the script in src directory (development) or dist directory (production)
            // process.cwd() is usually apps/backend when running the backend
            const srcScriptPath = path.join(process.cwd(), 'src', 'metatrader-connection', 'scripts', 'verify_mt5.py');
            const distScriptPath = path.join(__dirname, 'scripts', 'verify_mt5.py');

            let scriptPath: string;
            if (fs.existsSync(srcScriptPath)) {
                scriptPath = srcScriptPath;
                this.logger.debug(`Using source script path: ${scriptPath}`);
            } else if (fs.existsSync(distScriptPath)) {
                scriptPath = distScriptPath;
                this.logger.debug(`Using dist script path: ${scriptPath}`);
            } else {
                this.logger.error(`Script not found. CWD: ${process.cwd()}, Tried: ${srcScriptPath} and ${distScriptPath}`);
                return resolve({
                    success: false,
                    error: 'Python verification script not found'
                });
            }

            // Using python3 or python depending on env. Assuming 'python' is available and has MetaTrader5 installed.
            // In a real env, we might need to configure the python path.
            const pythonProcess = spawn('python', [
                scriptPath,
                String(credentials.login),
                credentials.password,
                credentials.server,
            ]);

            let output = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            // Set a timeout of 30 seconds
            const timeout = setTimeout(() => {
                this.logger.error('Python verification script timed out');
                pythonProcess.kill();
                resolve({ success: false, error: 'Connection timed out. Please check your internet connection and broker server address.' });
            }, 30000);

            pythonProcess.on('close', (code) => {
                clearTimeout(timeout);
                if (code !== 0 && code !== null) { // code is null if killed
                    this.logger.error(`Python script exited with code ${code}: ${errorOutput}`);
                    // Fallback if script crashes
                    return resolve({ success: false, error: errorOutput || 'Script failed' });
                }

                if (pythonProcess.killed) return; // Already handled by timeout

                try {
                    const result = JSON.parse(output.trim());
                    resolve(result);
                } catch (e) {
                    this.logger.error('Failed to parse Python script output', output);
                    resolve({ success: false, error: 'Invalid response from script' });
                }
            });

            pythonProcess.on('error', (err) => {
                this.logger.error('Failed to start python process', err);
                resolve({ success: false, error: 'Failed to execute verification script' });
            });
        });
    }
}
