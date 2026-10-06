import * as utils from "./internals/utils";

export class ViewWriter {
  public items: ArrayBuffer[] = [];

  /**
   * Writes buffer
   * @param buf
   */
  public write(buf: ArrayBuffer | Uint8Array): void {
    this.items.push(buf instanceof ArrayBuffer ? buf : utils.concat([buf]));
  }

  /**
   * Concatenates all buffers
   * @returns Concatenated buffer
   */
  public final(): ArrayBuffer {
    return utils.concat(this.items);
  }
}
