const FRAME_SIZE = 320;
const FRAMES_NEEDED = 8;
const BUFFER_SIZE = FRAME_SIZE * FRAMES_NEEDED;

export class AudioBuffer {
  private buffer = new Uint8Array(BUFFER_SIZE);
  private offset = 0;

  push(frame: Uint8Array): Uint8Array | null {
    const space = BUFFER_SIZE - this.offset;
    const toCopy = Math.min(frame.length, space);

    this.buffer.set(frame.subarray(0, toCopy), this.offset);
    this.offset += toCopy;

    if (this.offset >= BUFFER_SIZE) {
      const result = new Uint8Array(this.buffer);
      this.offset = 0;

      if (toCopy < frame.length) {
        const remainder = frame.subarray(toCopy);
        this.buffer.set(remainder, 0);
        this.offset = remainder.length;
      }

      return result;
    }

    return null;
  }
}
