import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

export abstract class BaseService<T> {
  protected http: HttpClient = inject(HttpClient);
  protected basePath: string = `${environment.baseUrl}`;

  protected abstract resourceEndpoint(): string;

  protected resourcePath(): string {
    return `${this.basePath}/${this.resourceEndpoint()}`;
  }

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(`${this.resourcePath()}/active`);
  }

  getById(id: string): Observable<T> {
    return this.http.get<T>(`${this.resourcePath()}/${id}`);
  }

  create(item: T): Observable<T> {
    return this.http.post<T>(this.resourcePath(), item);
  }

  updateById(id: string, item: T): Observable<T> {
    return this.http.put<T>(`${this.resourcePath()}/${id}`, item);
  }

  deleteById(id: string): Observable<void> {
    return this.http.delete<void>(`${this.resourcePath()}/${id}`);
  }
}
