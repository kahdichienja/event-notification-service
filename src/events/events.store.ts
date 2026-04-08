import { Injectable } from '@nestjs/common';

export interface AppEvent {
  id: string;
  type: string;
  payload: Record<string, any>;
  createdAt: string;
}

@Injectable()
export class EventsStore {
  private store = new Map<string, AppEvent>();

  save(event: AppEvent): void {
    this.store.set(event.id, event);
  }

  findById(id: string): AppEvent | undefined {
    return this.store.get(id);
  }
}
