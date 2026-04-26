import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClassListComponent } from './components/class-list/class-list.component';
import { ClassDetailComponent } from './components/class-detail/class-detail.component';

const routes: Routes = [
  {
    path: '',
    component: ClassListComponent
  },
  {
    path: ':id',
    component: ClassDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClassesRoutingModule { }
