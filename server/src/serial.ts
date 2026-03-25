import { SerialPort } from 'serialport';

export class SerialConnection {
  private _ready: boolean;
  private _port: SerialPort;
  private _debug: boolean;
  private _txData: string[];

  constructor(serialPort: SerialPort, debug: boolean = false) {
    this._ready = false;
    this._port = serialPort;
    this._debug = debug;
    this._txData = [];

    if (this._debug) {
      console.log('Starting write poller');
    }
    setInterval(() => this.bufferedWrite(), 50);
  }

  private bufferedWrite() {
    if (this._ready) {
      const data = this._txData.shift();
      if (data !== undefined) {
        if (this._debug) {
          console.log('Writing to serial: ' + data);
        }
        this._port.write(data, (err) => {
          if (err) {
            console.error('Error on write: ', err);
          }
        });
      }
    }
  }

  write(data: string) {
    this._txData.push(data);
  }

  get isReady() {
    return this._ready;
  }

  set setReady(value: boolean) {
    this._ready = value;
  }

  get port() {
    return this._port;
  }
}

export const selectSerialPort = async (debug: boolean = false): Promise<SerialPort> => {
  const ports = await SerialPort.list();

  let selectedIndex = -1;
  for (const p of ports) {
    if (p.path.includes('usbmodem')) {
      if (debug) {
        console.log(`Found Arduino at ${p.path}`);
      }
      selectedIndex = ports.indexOf(p);
    }
  }

  if (selectedIndex === -1) {
    throw new Error('No Arduino found (no usbmodem port detected)');
  }

  const serialPort = new SerialPort({
    path: ports[selectedIndex].path,
    baudRate: 230400,
    autoOpen: false,
  });

  serialPort.open((err) => {
    if (err) {
      throw new Error('Error opening port: ' + err.message);
    }
  });

  return serialPort;
};
