<template>
  <div ref="wrapRef">
    <div
      v-if="isShow"
      :class="[ClassNameEnum.CONTEXTMENU_WRAP]"
      class="context-menu-wrap"
      :style="
        styleAutoAddPx({
          left: left,
          top: top,
        })
      "
    >
      <ul v-if="list.length > 0" class="context-menu-ul">
        <template v-for="item in list" :key="item">
          <li v-if="!item.hide">
            <div
              class="context-menu-item"
              v-if="!item.separator"
              :class="{
                danger: item.danger,
              }"
              @click="handleClick(item.action)"
            >
              <AIcon :type="item.icon" />
              <span class="context-menu-item-title">
                <template v-if="typeof item.title === 'string'">
                  {{ item.title }}
                </template>
                <template v-else>
                  <VNodes :vnodes="item.title" />
                </template>
              </span>
            </div>
            <div v-else class="context-menu-item-separator"></div>
          </li>
        </template>
      </ul>
      <span v-else>Empty</span>
    </div>
  </div>
</template>

<script lang="ts" setup="">
import { useContextMenu } from "./hooks/useContextMenu";
import { ClassNameEnum } from "$vct/enums";
import { styleAutoAddPx } from "$vct/utils";
import { useGlobalStore } from "$vct/store/global";
import { onMounted, ref, watch } from "vue";
import { AIcon } from "$vct/components/AIcon";
import { ContextMenuItem } from "$vct/Grid/types";
import { onClickOutside } from "@vueuse/core";
const { isShow, left, top, renderProps, type } = useContextMenu();

const globalStore = useGlobalStore();

const wrapRef = ref<HTMLDivElement>();
const list = ref<ContextMenuItem[]>([]);
const VNodes = (_, { attrs }) => {
  return attrs.vnodes;
};

onMounted(() => {
  onClickOutside(wrapRef, () => {
    renderProps.value.close();
  });
});

watch(isShow, (val) => {
  if (val) {
    list.value = globalStore.contextMenuConfigs(renderProps.value, type.value);
  } else {
    list.value = [];
  }
});

function handleClick(cb) {
  cb();
  renderProps.value.close();
}
</script>

<style lang="less" scoped>
.context-menu-wrap {
  position: absolute;
  border-radius: var(--borderRadius);
  box-shadow: var(--cellBoxShadow);
  background: #fff;
  z-index: 10;
  min-width: 146px;
}

.context-menu-ul {
  padding: 4px 8px;
  margin: 0;
  list-style: none;
}

.context-menu-item {
  height: 34px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  &.danger {
    span {
      color: var(--dangerColor) !important;
    }
  }

  &:hover {
    span {
      color: var(--menuListItemHoverColor) !important;
    }
  }

  span.context-menu-item-title {
    font-size: 14px;
    line-height: 16px;
    margin-left: 4px;
    color: var(--textColor);
  }

  .app-iconify {
    color: var(--textColor2);
  }
}

.context-menu-item-separator {
  display: block;
  height: 1px;
  width: 100%;
  background: var(--lineColor);
}
</style>
