import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  searchUsers(query: string) {
    return this.http.get<any[]>(`${environment.apiUrl}/users/search/`, {
      params: { search: query },
    });
  }
}
