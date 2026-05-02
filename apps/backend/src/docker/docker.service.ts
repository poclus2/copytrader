import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Docker from 'dockerode';
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
     * Génère le fichier startup.ini pour MT5 avec auto-login
     * Utilise le format natif de terminal64.exe pour se connecter automatiquement
     */
    async generateStartupIni(containerName: string, credentials: any): Promise<string> {
        const iniContent = [
            '[Common]',
            `Login=${credentials.login || ''}`,
            `Password=${credentials.password || ''}`,
            `Server=${credentials.server || ''}`,
            'CertInstall=0',
            'AutoLogin=1',          // Connexion automatique au démarrage
            'SavePassword=1',       // Conserver le mot de passe
            'NewsEnable=0',         // Désactiver les news (accélère le démarrage)
            '',
            '[Charts]',
            'Profile=BridgeProfile',
            '',
            '[Experts]',
            'AllowDllImport=1',
            '',
            '[StartUp]',            // Section exécutée au démarrage
            `Expert=HarestechBridge_Draft`,
            'Symbol=EURUSD',
            'Period=1',             // M1
        ].join('\r\n');

        const iniFileName = `${containerName}.ini`;
        const iniFilePath = path.join(this.CONFIGS_DIR, iniFileName);
        
        await fsPromises.writeFile(iniFilePath, iniContent, 'utf-8');
        this.logger.log(`startup.ini generated at ${iniFilePath} (login=${credentials.login}, server=${credentials.server})`);
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
                        // 1. On injecte le fichier config auto-login dans le répertoire de MT5
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
                    // Le fichier est bindé dans C:\Program Files\MetaTrader 5\startup.ini
                    // Wine comprend le chemin Windows "C:\...". Les guillemets provoquent des problèmes de parsing dans wine/MT5.
                    'MT5_CMD_OPTIONS=/portable /config:C:\\Program Files\\MetaTrader 5\\startup.ini'
                ]
            };

            const container = await this.docker.createContainer(containerOptions);
            await container.start();
            
            // FIX: Correction automatique des permissions pour l'utilisateur interne 'abc'
            // Cela évite l'écran noir car l'utilisateur pourra écrire dans le dossier Wine.
            try {
                const exec = await container.exec({
                    Cmd: ['chown', '-R', 'abc:abc', '/config/.wine'],
                    User: 'root'
                });
                await exec.start({});
                this.logger.log(`Permissions fixed for container ${containerName}`);
            } catch (e) {
                this.logger.warn(`Could not fix permissions for ${containerName}: ${e.message}`);
            }

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

    /**
     * Retourne l'état détaillé du conteneur MT5 (running, stopped, not found...)
     */
    async getContainerStatus(id: string, isMaster: boolean): Promise<{
        status: 'running' | 'stopped' | 'not_found' | 'error';
        containerName: string;
        vncPort?: number;
        bridgePort?: number;
        startedAt?: string;
        image?: string;
    }> {
        const prefix = isMaster ? 'mt5-master' : 'mt5-slave';
        const containerName = `${prefix}-${id}`;

        try {
            const matches = await this.docker.listContainers({
                all: true,
                filters: { name: [containerName] },
            });

            if (matches.length === 0) {
                return { status: 'not_found', containerName };
            }

            const c = matches[0];
            const vncPort = c.Ports?.find(p => p.PrivatePort === 3000)?.PublicPort;
            const bridgePort = c.Ports?.find(p => p.PrivatePort === 5000)?.PublicPort;

            const isRunning = c.State === 'running';
            return {
                status: isRunning ? 'running' : 'stopped',
                containerName,
                vncPort,
                bridgePort,
                startedAt: c.Status,
                image: c.Image,
            };
        } catch (error) {
            this.logger.error(`Error checking container status for ${containerName}:`, error);
            return { status: 'error', containerName };
        }
    }

    /**
     * Démarre un conteneur MT5 existant qui serait stoppé.
     * Si des credentials sont fournis, le startup.ini est régénéré avant le démarrage
     * pour s'assurer que MT5 se connecte automatiquement avec les bons identifiants.
     */
    async startContainer(id: string, isMaster: boolean, credentials?: any): Promise<{
        success: boolean;
        message: string;
        containerName: string;
    }> {
        const prefix = isMaster ? 'mt5-master' : 'mt5-slave';
        const containerName = `${prefix}-${id}`;

        try {
            const matches = await this.docker.listContainers({
                all: true,
                filters: { name: [containerName] },
            });

            if (matches.length === 0) {
                return { success: false, message: 'Container not found. Please recreate the master.', containerName };
            }

            const c = matches[0];
            if (c.State === 'running') {
                return { success: true, message: 'Container is already running.', containerName };
            }

            // Régénérer le startup.ini avec les credentials frais avant le redémarrage
            // Le fichier est bind-mounté, donc MT5 lira la version mise à jour
            if (credentials && (credentials.login || credentials.password || credentials.server)) {
                try {
                    await this.generateStartupIni(containerName, credentials);
                    this.logger.log(`startup.ini refreshed for ${containerName} before restart`);
                } catch (e) {
                    this.logger.warn(`Could not refresh startup.ini for ${containerName}: ${e.message}`);
                }
            }

            const container = this.docker.getContainer(c.Id);
            await container.start();
            this.logger.log(`Container ${containerName} started via API request.`);
            return { success: true, message: 'Container started successfully.', containerName };
        } catch (error) {
            this.logger.error(`Error starting container ${containerName}:`, error);
            return { success: false, message: error.message, containerName };
        }
    }
}
