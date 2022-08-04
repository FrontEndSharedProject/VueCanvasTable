import { useStore } from "@/hooks/useStore";
import { ref, Ref, CSSProperties, watchEffect } from "vue";

type ReturnType = {
  themeStyles: Ref<CSSProperties>;
};

export function useThemes(): ReturnType {
  const { themes } = useStore();

  const themeStyles = ref<CSSProperties>({});

  watchEffect(() => {
    let styles: CSSProperties = {};

    Object.keys(themes.value).map((key) => {
      styles[`--${key}`] = themes.value[key];
    });

    themeStyles.value = styles;
  });

  return {
    themeStyles,
  };
}
