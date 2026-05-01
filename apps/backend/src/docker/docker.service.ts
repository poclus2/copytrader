import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Docker from 'dockerode';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

@Injectable()
export class DockerService implements OnModuleInit {
    private readonly logger = new Logger(DockerService.name);
    private docker: Docker;
    
    // Chemin sur le système hôte où les fichiers INI seront stockés.
    private readonly CONFIGS_DIR = path.join(process.cwd(), 'mt5_configs');
    
    // L'image Docker que l'on vient de tester
    private readonly MT5_IMAGE_NAME = 'gmag11/metatrader5_vnc:latest';
    // Le nom du réseau Docker pour que tout communique
    private readonly NETWORK_NAME = 'trading-net';

    constructor() {
        // Connexion au socket Docker local (Windows via pipe ou Linux via sock)
        const socketPath = process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock';
        this.docker = new Docker({ socketPath });
    }

    async onModuleInit() {
        this.logger.log('DockerService initialized');
        try {
            await this.docker.ping();
            this.logger.log('Connected to Docker Daemon successfully');
            
            if (!fs.existsSync(this.CONFIGS_DIR)) {
                await fsPromises.mkdir(this.CONFIGS_DIR, { recursive: true });
            }

            // S'assurer que le réseau existe
            const networks = await this.docker.listNetworks();
            const networkExists = networks.some(n => n.Name === this.NETWORK_NAME);
            if (!networkExists) {
                this.logger.log(`Creating Docker network: ${this.NETWORK_NAME}`);
                await this.docker.createNetwork({ Name: this.NETWORK_NAME });
            }

        } catch (error) {
            this.logger.warn('Could not connect to Docker Daemon. Ensure Docker Desktop is running locally.');
        }
    }

    /**
     * Trouve un port libre sur l'hôte pour le VNC
     */
    private async findFreePort(startPort: number = 8081): Promise<number> {
        // En vrai production, on utiliserait un module portfinder
        // Pour simplifier ici on liste les conteneurs et on trouve le max
        const containers = await this.docker.listContainers({ all: true });
        let maxPort = startPort - 1;
        
        for (const c of containers) {
            if (c.Ports) {
                for (const p of c.Ports) {
                    if (p.PublicPort && p.PublicPort > maxPort && p.PublicPort < 9000) {
                        maxPort = p.PublicPort;
                    }
                }
            }
        }
        return maxPort + 1;
    }

    /**
     * Génère le fichier startup.ini pour MT5
     */
    private async generateStartupIni(containerName: string, credentials: any): Promise<string> {
        const port = 5000; // Port standard pour notre Bridge
        const iniContent = `[Common]
Login=${credentials.login || ''}
Password=${credentials.password || ''}
Server=${credentials.server || ''}
CertInstall=0
[Charts]
Profile=BridgeProfile
[Experts]
HarestechBridge_Draft.ex5=EURUSD,M1,port=${port}
`;
        const iniFileName = `${containerName}.ini`;
        const iniFilePath = path.join(this.CONFIGS_DIR, iniFileName);
        
        await fsPromises.writeFile(iniFilePath, iniContent, 'utf-8');
        return iniFilePath;
    }

    /**
     * Crée et démarre un conteneur MT5
     * Retourne les infos de connexion { containerName, vncPort, bridgePort }
     */
    async createMT5Container(id: string, credentials: any, isMaster: boolean) {
        const prefix = isMaster ? 'mt5-master' : 'mt5-slave';
        const containerName = `${prefix}-${id}`;
        
        this.logger.log(`Creating container: ${containerName}`);

        try {
            // Vérifier si le conteneur existe déjà
            const existing = await this.docker.listContainers({ all: true, filters: { name: [containerName] } });
            if (existing.length > 0) {
                this.logger.log(`Container ${containerName} already exists, starting it...`);
                const container = this.docker.getContainer(existing[0].Id);
                if (existing[0].State !== 'running') await container.start();
                
                return { 
                    containerName, 
                    vncPort: existing[0].Ports?.find(p => p.PrivatePort === 3000)?.PublicPort, 
                    bridgePort: existing[0].Ports?.find(p => p.PrivatePort === 5000)?.PublicPort 
                };
            }

            // 1. Génération de la configuration
            const iniFilePath = await this.generateStartupIni(containerName, credentials);
            
            // 2. Attribution des ports hôtes libres (VNC et Bridge)
            const vncPort = await this.findFreePort(8081);
            const bridgePort = await this.findFreePort(vncPort + 1);

            // 3. Définition du conteneur avec l'image gmag11/metatrader5_vnc
            const containerOptions: Docker.ContainerCreateOptions = {
                Image: this.MT5_IMAGE_NAME,
                name: containerName,
                HostConfig: {
                    NetworkMode: this.NETWORK_NAME,
                    PortBindings: {
                        '3000/tcp': [{ HostPort: `${vncPort}` }], // Port Web VNC
                        '5000/tcp': [{ HostPort: `${bridgePort}` }] // Port TCP Bridge MT5
                    },
                    Binds: [
                        // 1. On injecte le fichier config auto-login
                        `${iniFilePath}:/config/.wine/drive_c/Program Files/MetaTrader 5/startup.ini`,
                        // 2. On injecte le Bridge EA directement dans le MetaTrader
                        `${path.join(process.cwd(), 'src', 'metatrader-connection', 'mql5', 'HarestechBridge_Draft.ex5')}:/config/.wine/drive_c/Program Files/MetaTrader 5/MQL5/Experts/HarestechBridge_Draft.ex5`
                    ],
                    Memory: 768 * 1024 * 1024, // 768 MB ram
                },
                Env: [
                    'CUSTOM_USER=copytrader',
                    'PASSWORD=copytrader',
                    'VNC_PASSWORD=copytrader',
                ]
            };

            const container = await this.docker.createContainer(containerOptions);
            await container.start();
            
            this.logger.log(`Container ${containerName} started successfully (VNC: ${vncPort}, Bridge: ${bridgePort}).`);
            
            return {
                containerName,
                vncPort,
                bridgePort
            };
        } catch (error) {
            this.logger.error(`Error creating container ${containerName}:`, error);
            throw error;
        }
    }

    /**
     * Arrête et supprime un conteneur MT5
     */
    async removeMT5Container(id: string, isMaster: boolean): Promise<boolean> {
        const prefix = isMaster ? 'mt5-master' : 'mt5-slave';
        const containerName = `${prefix}-${id}`;
        
        try {
            const container = this.docker.getContainer(containerName);
            await container.stop();
            await container.remove();
            
            const iniFilePath = path.join(this.CONFIGS_DIR, `${containerName}.ini`);
            if (fs.existsSync(iniFilePath)) await fsPromises.unlink(iniFilePath);

            this.logger.log(`Container ${containerName} removed successfully.`);
            return true;
        } catch (error) {
            return false;
        }
    }
}
