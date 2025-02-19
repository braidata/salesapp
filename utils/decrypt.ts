import { Buffer } from 'buffer';

export function decodeBase64(str: string): string {
    return Buffer.from(str, 'base64').toString('utf-8');
}