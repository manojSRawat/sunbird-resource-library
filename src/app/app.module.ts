import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { QuestionCursor } from '@project-sunbird/sunbird-quml-player-v8';
import { EditorCursorImplementationService } from './editor-cursor-implementation.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot([])
  ],
  providers: [
    { provide: QuestionCursor, useExisting: EditorCursorImplementationService },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
