/**
 * 事件中心
 * 使用
 *   const eventBaseMethods = useEventBase();
 *   const payload: EventPayloadType<EventName.CELL_VALUE_UPDATE> = {}
 *   eventBaseMethods.emit(EventName.CELL_VALUE_UPDATE, payload);
 *
 */
import { useGlobalStore } from "$vct/store/global";
import EventEmitter from "eventemitter3";
import { EventName } from "$vct/enums";
import { CellInterface, Note, StatisticsUpdatePayload } from "$vct/types";
import { Column, Row } from "$vct/Grid/types";
import { onBeforeUnmount } from "vue";

export type EventTypes = {
  [EventName.CELL_VALUE_UPDATE]: (
    payload: {
      value: string;
      rowId: string;
      columnId: string;
      row: Row;
      column: Column;
      oldValue: string;
      isVerified: boolean;
    } & CellInterface
  ) => void;
  [EventName.CELL_NOTE_UPDATE]: (payload: Note) => void;
  [EventName.CELL_NOTE_DELETED]: (payload: Note) => void;
  [EventName.STATISTICS_UPDATE]: (payload: StatisticsUpdatePayload) => void;
  [EventName.STATISTICS_SELECTION_UPDATE]: (payload: {
    sum: string;
    average: string;
    count: string;
  }) => void;
  [EventName.FROZEN_COLUMNS_CHANGE]: (index: number) => void;
  [EventName.COLUMN_WIDTH_CHANGE]: (payload: Record<string, number>) => void;
  [EventName.COLUMNS_POSITION_SORT]: (idsArr: string[]) => void;
};

export type EventBaseReturnType = Pick<
  Extract<EventEmitter, {}>,
  | "emit"
  | "on"
  | "off"
  | "once"
  | "removeAllListeners"
  | "listeners"
  | "listenerCount"
>;

export type EventPayloadType<T extends EventName> = Parameters<
  EventTypes[T]
>[0];

let cache: EventBaseReturnType | null = null;

export function useEventBase(): EventBaseReturnType {
  if (cache) return cache;

  const globalStore = useGlobalStore();

  onBeforeUnmount(() => {
    cache = null;
  });

  cache = {
    emit: globalStore._eventEmitter.emit.bind(globalStore._eventEmitter),
    on: globalStore._eventEmitter.on.bind(globalStore._eventEmitter),
    off: globalStore._eventEmitter.off.bind(globalStore._eventEmitter),
    once: globalStore._eventEmitter.once.bind(globalStore._eventEmitter),
    removeAllListeners: globalStore._eventEmitter.removeAllListeners.bind(
      globalStore._eventEmitter
    ),
    listeners: globalStore._eventEmitter.listeners.bind(
      globalStore._eventEmitter
    ),
    listenerCount: globalStore._eventEmitter.listenerCount.bind(
      globalStore._eventEmitter
    ),
  };

  return cache;
}
