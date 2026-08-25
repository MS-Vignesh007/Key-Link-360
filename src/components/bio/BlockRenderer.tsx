import React, { memo } from "react";
import type { BlockRendererContext, BlockRendererHandlers, BlockRendererProps } from "./blockTypes";
import { renderBlockView } from "./blockViews";

const EMPTY_HANDLERS: BlockRendererHandlers = {};
const EMPTY_CONTEXT: BlockRendererContext = {};

const BlockRenderer = memo(function BlockRenderer({
  block,
  mode,
  context = EMPTY_CONTEXT,
  handlers = EMPTY_HANDLERS
}: BlockRendererProps) {
  return (
    <>
      {renderBlockView({
        block,
        mode,
        context,
        handlers
      })}
    </>
  );
});

export default BlockRenderer;
export type { BlockRendererContext, BlockRendererHandlers, BlockRendererProps, BlockRenderMode } from "./blockTypes";
