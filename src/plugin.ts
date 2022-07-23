/*
 * This is an experimental implementation of plugins. It is used by
 * https://github.com/tatethurston/TwirpScript.
 *
 * This interface is likely to churn. If you are interested in creating a plugin,
 * please open an issue on https://github.com/tatethurston/ProtoScript.
 */
import type { Config } from "./codegen/autogenerate/index.js";
import type { ParsedAst } from "./codegen/utils.js";

/**
 * @private this is experimental and likely to change
 */
export interface PluginOpts {
  config: Config;
  ast: ParsedAst;
}

/**
 * @private this is experimental and likely to change
 */
export interface PluginOut {
  imports: string;
  services: string;
}

/**
 * @private this is experimental and likely to change
 */
export type Plugin = (opts: PluginOpts) => Partial<PluginOut> | undefined;

export {
  /**
   * @private this is experimental and likely to change
   */
  printHeading,
  /**
   * @private this is experimental and likely to change
   */
  printComments,
  /**
   * @private this is experimental and likely to change
   */
  printIfTypescript,
  /**
   * @private this is experimental and likely to change
   */
  addJSONSuffixToFullyQualifiedName,
} from "./codegen/autogenerate/index.js";

export {
  /**
   * @private this is experimental and likely to change
   */
  compile,
} from "./codegen/compile.js";
