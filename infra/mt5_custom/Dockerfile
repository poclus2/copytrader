FROM gmag11/metatrader5_vnc:1.0

# Copier l'EA Bridge dans le dossier Experts de MetaTrader
# Ce chemin correspond à la structure par défaut de l'installation MT5 sous Wine
COPY ./Bridge.ex5 "/config/.wine/drive_c/Program Files/MetaTrader 5/MQL5/Experts/Bridge.ex5"

# Note: Le fichier startup.ini contenant les identifiants et l'instruction
# d'auto-load de l'EA sera monté dynamiquement par le backend lors de la
# création du conteneur via docker.sock
