import {Component} from '@angular/core';
import {UserService} from '../../../../user/services/user.service';
import {ToasterService} from '../../../../core/services/toaster.service';
import {finalize, take} from 'rxjs/operators';
import {Pageable} from '../../../../shared/models/pageable';
import {Constants} from '../../../../config/constants';
import {User} from '../../../../shared/models/user';
import {SidebarService} from "../../../../shared/services/sidebar.service";
import {UserEditingFormComponent} from "../users-options/user-editing-form/user-editing-form.component";

@Component({
  selector: 'app-table-users',
  templateUrl: './table-users.component.html',
  styleUrls: ['./table-users.component.scss']
})
export class TableUsersComponent {

  loading = true; // indique si les données sont en chargement
  // Ne pas oublier de retirer du tableau la valeur 'all' utilisée
  // afin de pouvoir cocher/décocher toutes les cases d'un coup

  selectedUsers: User[] = [];

  // Pagination
  pageable: Pageable<User> = Constants.PAGEABLE_DEFAULT;
  rowsPerPage = this.pageable.rowsPerPages[0];
  users!: any;
  constructor(
    private userService: UserService,
    private toastService: ToasterService,
    protected sidebarService: SidebarService,
  ) {
  }

  loadUsers({first, rows}): void {
    this.loading = true;
    const page = first / rows;

    this.userService
      .getAll({page, rows})
      .pipe(
        take(1),
        finalize(() => this.loading = false)
      )
      .subscribe(
        data => {
          this.pageable.totalPages = data.totalPages;
          this.pageable.rows = data.size;
          this.pageable.totalElements = data.totalElements;
          this.pageable.content = data.content;
        },
        () => this.toastService.error('Oops', 'Une erreur est survenue lors de la récupération des données'),
      );
    /*
    editUser(user: User): void {
      this.sidebarService
        .open({
          title: `Editer une nouvelle offre d'emploi`,
          input: {job},
          component: JobPostingFormComponent,
          width: 650
        });
    }*/
  }

  editUser(user: User) : void{
    this.sidebarService
      .open({
        title: `Modifier un utilisateur`,
        input: {user},
        component: UserEditingFormComponent,
        width: 650
      });
  }
}
