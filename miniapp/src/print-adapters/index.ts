export interface PrintJob {
  certificateId: string;
  copies: number;
  payload: unknown;
}

export interface PrintAdapter {
  name: string;
  connect(): Promise<void>;
  print(job: PrintJob): Promise<void>;
}

export class MockPrintAdapter implements PrintAdapter {
  name = 'mock';

  async connect() {
    return undefined;
  }

  async print(_job: PrintJob) {
    return undefined;
  }
}
