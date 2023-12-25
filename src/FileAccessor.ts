export type FileChangeResult = {
  name?: string;
  content: ArrayBuffer | DataView | Blob | string;
  options?: FilePropertyBag;
};

export type FileChangeEvent = CustomEvent<FileChangeResult> & {
  type: 'file-changed';
  composed: true;
};

export type FileAccessCompatible<A extends string = 'fileAccessor'> = {
  [accessor in A]: FileAccessor | undefined;
} & {
  addEventListener: <T extends keyof FileAccessCompatibleEventMap>(
    type: T,
    handler: (event: FileAccessCompatibleEventMap[T]) => void,
    options?: boolean | AddEventListenerOptions
  ) => void;
};

export interface FileAccessCompatibleEventMap extends HTMLElementEventMap {
  'file-changed': FileChangeEvent;
}

export class FileAccessor {
  hash: Promise<string>;
  changed: boolean = false;
  file: File;

  constructor(file: File) {
    this.file = file;
    this.hash = FileAccessor.hash(file);
  }

  readText() {
    return this.file.text();
  }

  readRaw() {
    return this.file.arrayBuffer();
  }

  static hash(file: File): Promise<string> {
    return file
      .arrayBuffer()
      .then((data) => crypto.subtle.digest('SHA-256', data))
      .then((digest) =>
        Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      );
  }

  write(content: string | ArrayBuffer | DataView | Blob) {
    let name = this.file.name;
    let type = this.file.type;
    let file = this.file = new File([content], name, { type });
    return Promise.all([this.hash, FileAccessor.hash(file)]).then(([_old, _new]) => {
      if (_old !== _new) {
        this.changed = true;
      } else {
        this.changed = false;
      }
      return this.hash = Promise.resolve(_new);
    });
  }
}
