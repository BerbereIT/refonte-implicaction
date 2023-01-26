import { Component, OnInit } from '@angular/core';

import {DialogModule} from 'primeng/dialog';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { UserService } from 'src/app/user/services/user.service';


@Component({
  selector: 'app-delete-user',
  templateUrl: './delete-user.component.html',
  styleUrls: ['./delete-user.component.scss']
})
export class DeleteUserComponent {
  public  title ="Merci de confirmer la suppression "
  public annuler =" Annuler"
  public valider =" Valider"

  constructor( 
    private userService: UserService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig ) { }



delete(){
  console.log("user delete " + JSON.stringify( this.config.data.user.user.id))
   this.userService.deleteUser(this.config.data.user.user.id)
  
  this.ref.close()
}

close(){
 this.ref.close();
}

}
