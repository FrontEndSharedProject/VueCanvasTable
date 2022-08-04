export type Column = {
  id: string;
  field: string;
  properties: Record<string, any>;
  readonly: boolean;
  renderer: Function;
  icon: string;
  [key: string]: any;
};

export type Row = {
  id: string;
  readonly: boolean;
  fields: Record<string, any>;
};
