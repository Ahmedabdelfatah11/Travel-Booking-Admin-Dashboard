import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IResetPassword } from '../../shared/Interfaces/ireset-password';
import { AuthModel } from '../../shared/Interfaces/i-auth-model';
import { Ilogin } from '../../shared/Interfaces/ilogin';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  
   private baseUrl = 'https://localhost:7277/api/Auth';   
constructor(
  private http: HttpClient,
  @Inject(PLATFORM_ID) private platformId: Object
) {}

private get isBrowser(): boolean {
  return isPlatformBrowser(this.platformId);
}
  

  confirmEmail(userId: string, code: string): Observable<any> {
    const model = {
      userId: userId,
      code: code
    };
    return this.http.post(`${this.baseUrl}/ConfirmEmail`, model);
  }

  ResendConfirmationEmail(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/ResendConfirmEmail`, { email });
  } 

  ForgetPassword(model:any):Observable<any>{
    return this.http.post(`${this.baseUrl}/ForgetPassword`,model)
  }

  ResetPassword(model: IResetPassword): Observable<any> {
    return this.http.post(`${this.baseUrl}/ResetPassword`, model);
  }

Login(model: Ilogin): Observable<AuthModel> {
  return this.http.post<AuthModel>(`${this.baseUrl}/Login`, model).pipe(
    tap(response => {
      if (this.isBrowser && response.isAuthenticated && response.token) {
        localStorage.setItem('authToken', response.token);   // Token
        localStorage.setItem('userId', response.email!);      // Optional: email or ID
        localStorage.setItem('username', response.username!);
        localStorage.setItem('roles', JSON.stringify(response.roles || [])); // Roles array
      }
    })
  );
}



Logout() {
  if (this.isBrowser) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('roles');
  }
}

isLoggedIn(): boolean {
  return this.isBrowser && !!localStorage.getItem('authToken');
}

getToken(): string | null {
  return this.isBrowser ? localStorage.getItem('authToken') : null;
}

  getUserId(): string | null {
    return this.isBrowser ? localStorage.getItem('userId') : null;
  }

  getUsername(): string | null {
    return this.isBrowser ? localStorage.getItem('username') : null;
  }

  getRoles(): string[] {
  if (!this.isBrowser) return [];
  const roles = localStorage.getItem('roles');
  return roles ? JSON.parse(roles) : [];
}

hasRole(role: string): boolean {
  return this.getRoles().includes(role);
}

}
