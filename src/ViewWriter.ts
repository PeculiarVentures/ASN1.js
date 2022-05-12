import * as utils from "./internals/utils";

export class ViewWriter {

  public items: ArrayBuffer[] = [];

  /**
   * Writes buffer
   * @param buf
   */
  public write(buf: ArrayBuffer): void {
    this.items.push(buf);
  }

  /**
   * Concatenates all buffers
   * @returns Concatenated buffer
   */
  public final(): ArrayBuffer {
    return utils.concat(this.items);
  }
}
