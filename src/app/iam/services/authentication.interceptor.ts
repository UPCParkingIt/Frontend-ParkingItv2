import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthenticationService } from './authentication.service';

export const authenticationInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthenticationService);

  // Skip adding token for driver (tablet) routes, public endpoints and edge services
  if (
    req.url.includes('/recognition/') ||
    req.url.includes('192.168.') ||
    req.url.includes('parking-it-edge')
  ) {
    return next(req);
  }

  const token = authService.getToken();
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
