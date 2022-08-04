# 自定义 cell Render

在 columns 数据中，提供 `cellRenderer` 即可，需要提供一个 vue 组件，
props 为

```typescript
type Porps = {
  value: string;
  renderProps: RendererProps;
  haveError: boolean; //  用来判断是否有输入错误，比如数据验证
};
```

# 自定义 editor

在 columns 数据中，提供 `cellEditor` 即可，需要提供一个 vue 组件，
props 为

```typescript
type Props = {
  renderProps: CellEditorProps;
};
```

## 使用输入时的条件验证

要想显示输入时的条件验证，首先确保 在 columns 数据中，提供 `dataVerification` 类型为 DataVerification

并且在 cellEditor 组件中，触发 `updateForDataVerification(string)` 事件，来更新判断，比如一个输入框，每次输入值都需要触发这个事件来实时监测

## 监听错误状态
