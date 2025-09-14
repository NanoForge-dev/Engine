import {INfException} from "../interfaces/exception.type";

export abstract class NfException extends Error implements INfException {
    abstract get code(): number;

    protected constructor(message?: string) {
        super(message ? `[NANOFORGE] ${message}` : "[NANOFORGE] An error occurred (Unknown exception).");
    }
}