import { type INetworkLibrary } from "../interfaces";
import { Library } from "../library";

export abstract class BaseNetworkLibrary extends Library implements INetworkLibrary {}
