// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            email: string;
            Password: string;
            country: string;
            pollInterval: number;
            temperatureUnit: string;
            keepValues: boolean;
            challengeId: string;
            dyson_code: string;
            token: string;
            disableReconnectLogging: boolean;
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
