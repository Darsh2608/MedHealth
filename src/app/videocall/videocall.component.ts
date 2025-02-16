import { Component } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-videocall',
  templateUrl: './videocall.component.html',
  styleUrls: ['./videocall.component.scss']
})
export class VideocallComponent {
  private destroy$: Subject<void> = new Subject<void>();
  private searchSubscription: Subject<string> = new Subject<string>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubscription.complete();
  }
}
