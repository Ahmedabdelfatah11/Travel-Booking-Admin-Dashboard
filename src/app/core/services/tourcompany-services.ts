import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class TourcompanyServices {
  private apiUrl = 'http://pyramigo.runasp.net/api/TourCompany';
  
  constructor(private http: HttpClient) { }
  
  GetallToursCompany(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }
}
