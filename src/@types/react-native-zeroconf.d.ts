declare module 'react-native-zeroconf' {
  interface ZeroconfService {
    name: string;
    type: string;
    domain: string;
    host?: string;
    addresses?: string[];
    port?: number;
    txt?: any;
  }

  export default class Zeroconf {
    scan(type?: string, protocol?: string, domain?: string): void;
    stop(): void;
    removeAllListeners(): void;
    on(event: 'start' | 'stop' | 'resolved' | 'remove' | 'error', callback: (data?: any) => void): void;
  }
}
