import { Injectable } from '@angular/core';
import { RxStomp, RxStompConfig } from '@stomp/rx-stomp';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private readonly rxStomp: RxStomp;

  constructor() {
    this.rxStomp = new RxStomp();

    const wsUrl = environment.baseUrl.replace(/\/api\/v\d+$/, '') + '/ws';

    const config: RxStompConfig = {
      webSocketFactory: () => new SockJS(wsUrl),

      // Headers can be added here if needed
      connectHeaders: {
        // login: 'guest',
        // passcode: 'guest'
      },

      // How often to heartbeat?
      // Interval in milliseconds, set to 0 to disable
      heartbeatIncoming: 0, // Typical value 0 - disabled
      heartbeatOutgoing: 20000, // Typical value 20000 - every 20 seconds

      // Wait in milliseconds before attempting auto reconnect
      // Set to 0 to disable
      // Typical value 500 (500 milliseconds)
      reconnectDelay: 5000,

      // Will log diagnostics on console
      // It can be quite verbose, not recommended in production
      // Uncomment this line to see all the debug messages
      debug: (msg: string): void => {
        if (!environment.production) {
          console.log(new Date(), msg);
        }
      }
    };

    this.rxStomp.configure(config);
    this.rxStomp.activate();
  }

  public getStompClient(): RxStomp {
    return this.rxStomp;
  }
}
