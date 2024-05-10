/*
 * Created with @iobroker/create-adapter v2.6.3
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import axios, { AxiosInstance } from 'axios';
import { Agent } from 'https';
import mqtt from 'mqtt';
import { rootCertificates } from 'node:tls';
import { getProduct } from './util/util';

// Data for the current device which are not provided by Web-API (IP-Address, MQTT-Password)
type DysonDevice = {
    Serial: string; // Serial number of the device
    ProductType: string; // Product type of the device
    Version: string;
    AutoUpdate: string;
    NewVersionAvailable: string;
    ConnectionType: string;
    Name: string;
    hostAddress: string;
    mqttPassword: string;
    mqttClient: mqtt.MqttClient;
    updateIntervalHandle: NodeJS.Timeout;
    ipAddress?: string;
};

// Load your modules here, e.g.:
// import * as fs from "fs";

class Tmp extends utils.Adapter {
    #axiosInstace: AxiosInstance;
    #isUp = false;

    constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({
            ...options,
            name: 'tmp',
        });

        this.#axiosInstace = axios.create({
            baseURL: 'https://appapi.cp.dyson.com',
            httpsAgent: new Agent({
                ca: [...rootCertificates],
                rejectUnauthorized: false,
            }),
            headers: {
                'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 8.1.0; Google Build/OPM6.171019.030.E1)',
                'Content-Type': 'application/json',
            },
        });

        this.on('ready', this.#onReady.bind(this));
        this.on('stateChange', this.#onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.#onUnload.bind(this));
    }

    #checkConfiguration() {
        let valid = true;
        const errorMessage: string[] = [];

        if (!this.config.email) {
            valid = false;
            errorMessage.push(
                'Invalid configuration provided: eMail address is missing. Please enter your eMail address.',
            );
        }
        if (!this.config.Password) {
            valid = false;
            errorMessage.push('Invalid configuration provided: password is missing. Please enter your password.');
        }
        if (!this.config.country) {
            valid = false;
            errorMessage.push('Invalid configuration provided: Country is missing. Please select your country.');
        }
        if (!this.config.temperatureUnit) {
            valid = false;
            errorMessage.push(
                'Invalid configuration provided: Temperature unit is missing. Please select a temperature unit.',
            );
        }
        if (!this.config.pollInterval || this.config.pollInterval < 1) {
            valid = false;
            errorMessage.push(
                'Invalid configuration provided: Poll interval is not valid. Please enter a valid poll interval (> 0s).',
            );
        }

        if (!valid) {
            for (const error of errorMessage) {
                this.log.error(error);
            }
            throw new Error('Given adapter config is invalid. Please fix.');
        }
    }

    async #getDysonDevices(token: string): Promise<DysonDevice[] | undefined> {
        return (
            await axios.get('/v2/provisioningservice/manifest', {
                headers: { Authorization: `Bearer ${token}` },
            })
        ).data;
    }

    async #createOrExtendObject(id: string, data: ioBroker.SettableObject, value: any) {
        if (this.#isUp) {
            return this.setState(id, value, true);
        }
        try {
            await this.getObjectAsync(id);
            await this.extendObjectAsync(id, data);
        } catch (error) {
            await this.setObjectNotExistsAsync(id, data);
        } finally {
            this.setState(id, value, true);
        }
    }

    #initializeDataStructure(device: DysonDevice, hostAddress?: ioBroker.StateValue) {
        const product = getProduct(device.ProductType);
        this.#createOrExtendObject(
            device.Serial,
            {
                type: 'device',
                common: {
                    name: product?.name ?? '',
                    icon: product?.icon ?? '',
                    // type: 'string',
                },
                native: {},
            },
            device.Serial,
        );
        this.#createOrExtendObject(
            `${device.Serial}.Firmware`,
            {
                type: 'channel',
                common: {
                    name: 'Information on devices firmware',
                    // read: true,
                    // write: false,
                    // type: 'string',
                    role: 'value',
                },
                native: {},
            },
            null,
        );
        this.#createOrExtendObject(
            `${device.Serial}.SystemState`,
            {
                type: 'folder',
                common: {
                    name: 'Information on devices system state (Filter, Water tank, ...)',
                    read: true,
                    write: false,
                    type: 'string',
                    role: 'value',
                },
                native: {},
            },
            null,
        );
        this.#createOrExtendObject(
            `${device.Serial}.SystemState.product-errors`,
            {
                type: 'channel',
                common: {
                    name: 'Information on devices product errors - false=No error, true=Failure',
                    // read: true,
                    // write: false,
                    // type: 'string',
                    role: 'value',
                },
                native: {},
            },
            null,
        );
        this.#createOrExtendObject(
            `${device.Serial}.SystemState.product-warnings`,
            {
                type: 'channel',
                common: {
                    name: 'Information on devices product-warnings - false=No error, true=Failure',
                    // read: true,
                    // write: false,
                    // type: 'string',
                    role: 'value',
                },
                native: {},
            },
            null,
        );
        this.#createOrExtendObject(
            `${device.Serial}.SystemState.module-errors`,
            {
                type: 'channel',
                common: {
                    name: 'Information on devices module-errors - false=No error, true=Failure',
                    // read: true,
                    // write: false,
                    // type: 'string',
                    role: 'value',
                },
                native: {},
            },
            null,
        );
        this.#createOrExtendObject(
            `${device.Serial}.SystemState.module-warnings`,
            {
                type: 'channel',
                common: {
                    name: 'Information on devices module-warnings - false=No error, true=Failure',
                    // read: true,
                    // write: false,
                    // type: 'string',
                    role: 'value',
                },
                native: {},
            },
            null,
        );
        this.#createOrExtendObject(
            `${device.Serial}.Firmware.Version`,
            {
                type: 'state',
                common: {
                    name: 'Current firmware version',
                    read: true,
                    write: false,
                    role: 'value',
                    type: 'string',
                },
                native: {},
            },
            device.Version,
        );
        this.#createOrExtendObject(
            `${device.Serial}.Firmware.Autoupdate`,
            {
                type: 'state',
                common: {
                    name: "Shows whether the device updates it's firmware automatically if update is available.",
                    read: true,
                    write: true,
                    role: 'indicator',
                    type: 'boolean',
                },
                native: {},
            },
            device.AutoUpdate,
        );
        this.#createOrExtendObject(
            `${device.Serial}.Firmware.NewVersionAvailable`,
            {
                type: 'state',
                common: {
                    name: 'Shows whether a firmware update for this device is available online.',
                    read: true,
                    write: false,
                    role: 'indicator',
                    type: 'boolean',
                },
                native: {},
            },
            device.NewVersionAvailable,
        );
        this.#createOrExtendObject(
            `${device.Serial}.ProductType`,
            {
                type: 'state',
                common: {
                    name: 'dyson internal productType.',
                    read: true,
                    write: false,
                    role: 'value',
                    type: 'string',
                },
                native: {},
            },
            device.ProductType,
        );
        this.#createOrExtendObject(
            `${device.Serial}.ConnectionType`,
            {
                type: 'state',
                common: {
                    name: 'Type of connection.',
                    read: true,
                    write: false,
                    role: 'value',
                    type: 'string',
                },
                native: {},
            },
            device.ConnectionType,
        );
        this.#createOrExtendObject(
            `${device.Serial}.Name`,
            {
                type: 'state',
                common: {
                    name: 'Name of device.',
                    read: true,
                    write: true,
                    role: 'value',
                    type: 'string',
                },
                native: {},
            },
            device.Name,
        );
        this.#createOrExtendObject(
            `${device.Serial}.Hostaddress`,
            {
                type: 'state',
                common: {
                    name: 'Local host address (IP) of device.',
                    read: true,
                    write: true,
                    role: 'value',
                    type: 'string',
                },
                native: {},
            },
            hostAddress ?? '',
        );
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async #onReady(): Promise<void> {
        try {
            this.#checkConfiguration();
            if (!this.config.token) {
                return;
            }
            this.log.info('Querying devices from dyson API.');
            const devices = await this.#getDysonDevices(this.config.token);
            if (!devices?.length) {
                this.log.error(
                    'Unable to retrieve data from dyson servers. May be e.g. a failed login or connection issues. Please check.',
                );
                return;
            }
            for (const device of devices) {
                this.log.debug(`Querying Host-Address of device: ${device.Serial}`);
                let hostAddress = '';
                try {
                    const hostAddressState = await this.getStateAsync(`${device.Serial}.Hostaddress`);
                    this.log.debug(
                        `Got Host-Address-object [${JSON.stringify(hostAddress)}] for device: ${device.Serial}`,
                    );
                    device.hostAddress = hostAddressState?.val?.toString() ?? '';
                } catch (error) {
                    if (error instanceof Error) {
                        this.log.error(`[CreateOrUpdateDevice] Error: ${error}, Callstack: ${error.stack}`);
                    }
                } finally {
                    this.#initializeDataStructure(device, device.hostAddress);
                }
            }
        } catch (error) {
            this.setState('info.connection', false, true);
            if (error instanceof Error) {
                error.stack ? this.log.error(error.stack) : this.log.error(error.message);
            }
        }

        // // Initialize your adapter here

        // // Reset the connection indicator during startup
        // this.setState('info.connection', false, true);

        // // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // // this.config:
        // this.log.info('config option1: ' + this.config.option1);
        // this.log.info('config option2: ' + this.config.option2);

        // /*
        // For every state in the system there has to be also an object of type state
        // Here a simple template for a boolean variable named "testVariable"
        // Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
        // */
        // await this.setObjectNotExistsAsync('testVariable', {
        //   type: 'state',
        //   common: {
        //     name: 'testVariable',
        //     type: 'boolean',
        //     role: 'indicator',
        //     read: true,
        //     write: true
        //   },
        //   native: {}
        // });

        // // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
        // this.subscribeStates('testVariable');
        // // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
        // // this.subscribeStates('lights.*');
        // // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
        // // this.subscribeStates('*');

        // /*
        // 	setState examples
        // 	you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
        // */
        // // the variable testVariable is set to true as command (ack=false)
        // await this.setStateAsync('testVariable', true);

        // // same thing, but the value is flagged "ack"
        // // ack should be always set to true if the value is received from or acknowledged from the target system
        // await this.setStateAsync('testVariable', { val: true, ack: true });

        // // same thing, but the state is deleted after 30s (getState will return null afterwards)
        // await this.setStateAsync('testVariable', {
        //   val: true,
        //   ack: true,
        //   expire: 30
        // });

        // // examples for the checkPassword/checkGroup functions
        // let result = await this.checkPasswordAsync('admin', 'iobroker');
        // this.log.info('check user admin pw iobroker: ' + result);

        // result = await this.checkGroupAsync('admin', 'admin');
        // this.log.info('check group user admin group admin: ' + result);
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    #onUnload(callback: () => void): void {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            callback();
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  */
    // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /**
     * Is called if a subscribed state changes
     */
    #onStateChange(id: string, state: ioBroker.State | null | undefined): void {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  */
    // private onMessage(obj: ioBroker.Message): void {
    //     if (typeof obj === 'object' && obj.message) {
    //         if (obj.command === 'send') {
    //             // e.g. send email or pushover or whatever
    //             this.log.info('send command');

    //             // Send response in callback if required
    //             if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
    //         }
    //     }
    // }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Tmp(options);
} else {
    // otherwise start the instance directly
    (() => new Tmp())();
}
