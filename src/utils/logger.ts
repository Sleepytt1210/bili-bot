import winston, { createLogger, format, transports } from 'winston';

type Logger = winston.Logger;

export const getLogger = (moduleName: string): Logger => {
    return createLogger({
        level: 'info',
        format: format.combine(
            format.label({label: moduleName}),
            format.timestamp(),
            format.colorize(),
            format.printf(({level, message, label, timestamp}): string => {
                return `${timestamp} [${level}][${label}] ${message}`;
            })
        ),
        transports: [
            new transports.Console()
        ]
    });
}
export { Logger };
