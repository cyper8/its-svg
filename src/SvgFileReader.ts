import { ReactiveControllerHost } from 'lit';
import { AccessibleFile } from './file-access.js';

export class SvgFileReader {
  static mimeType: string = 'image/svg+xml';

  host: ReactiveControllerHost;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
  }

  private _accessor?: AccessibleFile;
  get file() {
    if (this._accessor) return this._accessor.file;
    else throw new Error('The file is not accessible anymore.');
  }
  set file(f: File) {
    if (this._accessor) {
      this._accessor.file = f;
    } else {
      throw new Error('The file is not accessible anymore.');
    }
  }
  datauri?: string;

  private _reader?: FileReader;
  private _reading?: Promise<string>;
  get reading() {
    return this._reading;
  }
  content?: string;
  progress?: number;

  private _progress(_e: ProgressEvent) {
    let loaded = _e.loaded;
    let total = _e.total;
    this.progress = Math.round((loaded / total) * 100);
    this.host.requestUpdate();
  }

  private _abort(_e: ProgressEvent) {
    this._accessor = this.datauri = this.progress = this._reader = undefined;
    this.host.requestUpdate();
  }

  read(file: AccessibleFile): Promise<string> {
    this._accessor = file;
    if (this.datauri) URL.revokeObjectURL(this.datauri);
    this.datauri = URL.createObjectURL(this.file);
    this.content = undefined;
    this.progress = 0;
    this.host.requestUpdate();

    return (this._reading = new Promise<string>((resolve, reject) => {
      this._reader = new FileReader();
      this._reader.addEventListener('load', (_e: ProgressEvent) => {
        let result = this._reader?.result;
        if (typeof result === 'string') {
          this.host.requestUpdate();
          resolve((this.content = result));
        } else {
          reject(new Error('Svg file read produced no valid result.'));
        }
      });
      this._reader.addEventListener('error', (e: ProgressEvent) => {
        reject(
          new Error(
            `Svg file read failed on reading ${e.loaded} of ${e.total} bytes.`
          )
        );
      });
      this._reader.addEventListener('abort', this._abort.bind(this));
      this._reader.addEventListener('progress', this._progress.bind(this));
      this._reader.readAsText(file.file);
    }));
  }

  write(content: string) {
    if (!this._accessor) throw new Error('You need to open file first.');
    this.content = content;
    this.file = new File([content || ''], this._accessor.name, {
      type: SvgFileReader.mimeType,
    });
    if (this.datauri) URL.revokeObjectURL(this.datauri);
    this.datauri = URL.createObjectURL(this.file);
    this.progress = this._reader = undefined;
    this.host.requestUpdate();
  }

  reset(): this {
    this._accessor =
      this.datauri =
      this.progress =
      this._reader =
      this.content =
        undefined;
    this.host.requestUpdate();
    return this;
  }

  close = this.reset;

  newFile(name: string, content?: string) {
    if (this._accessor)
      throw new Error('You need to close currently opened file first.');
    this.content = content;
    this._accessor = {
      name: name,
      file: new File([content || ''], name, {
        type: SvgFileReader.mimeType,
      }),
    };
    if (this.datauri) URL.revokeObjectURL(this.datauri);
    this.datauri = URL.createObjectURL(this.file);
    this.progress = this._reader = undefined;
    this.host.requestUpdate();
  }

  abort() {
    this._reader?.abort();
  }
}
