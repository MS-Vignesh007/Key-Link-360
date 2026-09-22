import React from "react";
import { CanvaInlineText, type CanvaInlineTextProps } from "./CanvaDirectEditSuite";

export type InlineEditableTextProps = CanvaInlineTextProps;

export const InlineEditableText: React.FC<InlineEditableTextProps> = (props) => {
  return <CanvaInlineText {...props} />;
};

export default InlineEditableText;
