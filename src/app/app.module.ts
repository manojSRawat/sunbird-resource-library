import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { ResourceLibraryComponent, EditorCursor } from 'resource-library';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { QuestionCursor } from '@project-sunbird/sunbird-quml-player-v9';
import { EditorCursorImplementationService } from './editor-cursor-implementation.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ResourceLibraryComponent,
    BrowserAnimationsModule,
    RouterModule.forRoot([])
  ],
  providers: [
    { provide: QuestionCursor, useExisting: EditorCursorImplementationService },
    { provide: EditorCursor, useExisting: EditorCursorImplementationService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
