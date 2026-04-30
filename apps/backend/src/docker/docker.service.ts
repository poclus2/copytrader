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
    // Ce chemin DOIT être monté en volume dans le conteneur du backend
    // par exemple: -v ./infra/volumes/mt5_configs:/app/mt5_configs
    private readonly CONFIGS_DIR = path.join(process.cwd(), 'mt5_configs');
    
    // Le nom de l'image custom que nous allons créer
    private readonly MT5_IMAGE_NAME = 'harestech/mt5_bridge:latest';
    // Le nom du réseau Docker pour que tout communique
    private readonly NETWORK_NAME = 'trading-net';

    constructor() {
        // En docker, se connecte par défaut au socket local /var/run/docker.sock
        this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
    }

    async onModuleInit() {
        this.logger.log('DockerService initialized');
        try {
            await this.docker.ping();
            this.logger.log('Connected to Docker Daemon successfully');
            
            // Création du dossier des configs s'il n'existe pas
            if (!fs.existsSync(this.CONFIGS_DIR)) {
                await fsPromises.mkdir(this.CONFIGS_DIR, { recursive: true });
                this.logger.log(`Created configs directory at ${this.CONFIGS_DIR}`);
            }
        } catch (error) {
            this.logger.warn('Could not connect to Docker Daemon. Ensure /var/run/docker.sock is mounted if running in Docker, or Docker Desktop is running locally.');
        }
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
[Charts]
Profile=BridgeProfile
[Experts]
Bridge.ex5=EURUSD,M1,port=${port}
`;
        const iniFileName = `${containerName}.ini`;
        const iniFilePath = path.join(this.CONFIGS_DIR, iniFileName);
        
        await fsPromises.writeFile(iniFilePath, iniContent, 'utf-8');
        this.logger.debug(`Generated config file for ${containerName} at ${iniFilePath}`);
        
        return iniFileName;
    }

    /**
     * Crée et démarre un conteneur MT5
     */
    async createMT5Container(id: string, credentials: any, isMaster: boolean): Promise<string> {
        const prefix = isMaster ? 'mt5-master' : 'mt5-slave';
        const containerName = `${prefix}-${id}`;
        
        this.logger.log(`Creating container: ${containerName}`);

        try {
            // 1. Génération de la configuration (startup.ini)
            const iniFileName = await this.generateStartupIni(containerName, credentials);
            
            // Note: En mode "Docker-in-Docker" ou "Docker-sibling", le volume monté 
            // doit se référer au chemin absolu SUR L'HÔTE.
            // Pour le dev, on suppose qu'il y a un volume partagé nommé 'mt5_configs' 
            // ou on utilise un montage relatif si configuré dans compose.
            // Une solution propre est d'utiliser un Docker Volume nommé.
            const containerOptions: Docker.ContainerCreateOptions = {
                Image: this.MT5_IMAGE_NAME,
                name: containerName,
                HostConfig: {
                    NetworkMode: this.NETWORK_NAME,
                    Binds: [
                        // Montage du fichier config spécifique dans le dossier /config du conteneur MT5
                        // TODO: Ajuster le chemin source selon qu'on soit sur C:/ ou docker volume
                        `${path.resolve(this.CONFIGS_DIR, iniFileName)}:/config/startup.ini`
                    ],
                    // Limiter les ressources
                    Memory: 512 * 1024 * 1024, // 512 MB limits
                    MemorySwap: 1024 * 1024 * 1024,
                },
                Env: [
                    'MT5_CMD_OPTIONS=/config/startup.ini',
                    // On pourrait aussi ajouter VNC password
                ]
            };

            const container = await this.docker.createContainer(containerOptions);
            await container.start();
            
            this.logger.log(`Container ${containerName} started successfully.`);
            return containerName; // Ce nom sera utilisé comme DNS par le backend pour ce terminal
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
            
            // Suppression du fichier config
            const iniFilePath = path.join(this.CONFIGS_DIR, `${containerName}.ini`);
            if (fs.existsSync(iniFilePath)) {
                await fsPromises.unlink(iniFilePath);
            }

            this.logger.log(`Container ${containerName} removed successfully.`);
            return true;
        } catch (error) {
            this.logger.warn(`Error removing container ${containerName} (maybe it was already removed?)`);
            return false;
        }
    }
}
