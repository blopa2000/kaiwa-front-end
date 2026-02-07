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

  //datos del usuario logueado
  getCurrentUser() {
    return this.http.get<any>(`${environment.apiUrl}/users/me/`);
  }

  updateProfile(data: any) {
    return this.http.patch(`${environment.apiUrl}/users/me/`, data);
  }

  uploadPhoto(formData: FormData) {
    return this.http.patch(`${environment.apiUrl}/users/upload-photo/`, formData);
  }
}
