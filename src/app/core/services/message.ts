import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MessageService {
  constructor(private http: HttpClient) {}

  sendFirstMessage(payload: { content: string; recipient_id: number }) {
    return this.http.post<any>(`${environment.apiUrl}/messages/`, payload);
  }
}
