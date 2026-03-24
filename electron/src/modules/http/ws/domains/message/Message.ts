// domains/message/Message.ts
export abstract class Message {
  constructor(
    public id: string,
    public groupId: string,
    public sender: string,
    public timestamp: number,
    public type: 'text' | 'file' | 'image',
    public content: string,
  ) {}
}

export class TextMessage extends Message {
  constructor(id: string, groupId: string, sender: string, timestamp: number, content: string) {
    super(id, groupId, sender, timestamp, 'text', content)
  }
}

export class FileMessage extends Message {
  constructor(
    id: string,
    groupId: string,
    sender: string,
    timestamp: number,
    content: string,
    public fileName: string,
    public fileType: string,
    public transferMode?: 'inline' | 'remote',
    public fileId?: string,
    public size?: number,
    public downloadUrl?: string,
  ) {
    super(id, groupId, sender, timestamp, 'file', content)
  }
}

export class ImageMessage extends Message {
  constructor(id: string, groupId: string, sender: string, timestamp: number, content: string) {
    super(id, groupId, sender, timestamp, 'image', content)
  }
}
