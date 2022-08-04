import { debounce } from "lodash-es";
import { EventBase } from "@/mixins/EventBase";
import { CellInterface } from "@/types";

/**
 * 该文件用于管理 延迟 显示/隐藏 的时间
 * https://github.com/handsontable/handsontable/blob/6a1706061163b8d1f7752e54ef6f10efbc764b8b/handsontable/src/plugins/comments/displaySwitch.js
 */

const DEFAULT_DISPLAY_DELAY = 250;
const DEFAULT_HIDE_DELAY = 250;

type EventType = {
  show(coord: CellInterface): void;
  hide(): void;
};

class DisplaySwitch extends EventBase<EventType> {
  wasLastActionShow: boolean;
  showDebounced: any;
  hidingTimer: any;
  lastShowCoord: CellInterface = { rowIndex: -1, columnIndex: -1 };

  constructor() {
    super();
    this.wasLastActionShow = true;
    this.showDebounced = null;
    this.hidingTimer = null;

    this.updateDelay();
  }

  hide(force: boolean = false) {
    this.wasLastActionShow = false;

    this.hidingTimer = setTimeout(
      () => {
        if (
          this.wasLastActionShow === false &&
          this.lastShowCoord.rowIndex !== -1
        ) {
          this.lastShowCoord = { rowIndex: -1, columnIndex: -1 };
          this.$emit("hide");
        }
      },
      force ? 1 : DEFAULT_HIDE_DELAY
    );
  }

  show(coord: CellInterface) {
    this.wasLastActionShow = true;
    this.showDebounced(coord);
  }

  /**
   * Cancel hiding comment.
   */
  cancelHiding() {
    this.wasLastActionShow = true;

    clearTimeout(this.hidingTimer);
    this.hidingTimer = null;
  }

  updateDelay(displayDelay = DEFAULT_DISPLAY_DELAY) {
    this.showDebounced = debounce((coord: CellInterface) => {
      if (!this.wasLastActionShow) return;
      if (
        this.lastShowCoord.rowIndex === coord.rowIndex &&
        this.lastShowCoord.columnIndex === coord.columnIndex &&
        this.wasLastActionShow
      )
        return;

      this.lastShowCoord = coord;
      this.$emit("show", coord);
    }, displayDelay);
  }
}

export { DisplaySwitch };
