import type { IPC_ACTIONS_TYPE, IPC_ACTIONS } from '../../ipcActions'
import type { IpcActionHandlers } from './I'
import type { FILE_PICKER_OPEN_TYPE, FILE_PICKER_RES } from './file'
import type { IpcChannels } from './actionHandlers'

export type IPC_ACTIONS_KEY = keyof IPC_ACTIONS_TYPE
export type IPCActionArg<T> = T extends (...args: infer A) => any ? A : T extends object ? [T] : never;
export type IPCActionReturn<T> = T extends (...args: any[]) => infer R ? R : never;

export type IPC_ACTIONS_VALUE = IPC_ACTIONS_TYPE[keyof IPC_ACTIONS_TYPE];

export interface ELECTRON_BRIDGE {
    IPC_ACTIONS: IPC_ACTIONS_TYPE;

    ipcRenderer: {
        send: <V extends IPC_ACTIONS_VALUE>(
            channel: V,
            ...args: IPCActionArg<IPC_ACTIONS_TYPE[ReverseKey<V>]>
        ) => void;

        on: <K extends keyof IpcChannels, T = unknown>(
            channel: K,
            listener: (...args: IpcChannels[K]['args']) => InferIpcReturn<K, T>
        ) => void;

        removeListener: <K extends keyof IpcChannels, T = unknown>(
            channel: K,
            listener: (...args: IpcChannels[K]['args']) => InferIpcReturn<K, T>
        ) => void;

        invoke: <K extends keyof IpcChannels, T = unknown>(
            channel: K,
            ...args: IpcChannels[K]['args']
        ) => Promise<InferIpcReturn<K, T>>;
    };
}