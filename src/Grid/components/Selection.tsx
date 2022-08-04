import { createHTMLBox } from "../utils";

const Selection = (props) => {
  return createHTMLBox({ strokeWidth: 1, ...props });
};

export default Selection;
