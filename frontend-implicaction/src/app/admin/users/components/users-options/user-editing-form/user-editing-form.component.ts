import {Constants} from "../../../../../config/constants";
import {User} from "../../../../../shared/models/user";
import {UserService} from "../../../../../user/services/user.service";
import {AuthService} from "../../../../../shared/services/auth.service";
import {ToasterService} from "../../../../../core/services/toaster.service";
import {Component, HostListener, Input, OnInit} from "@angular/core";
import {finalize} from "rxjs/operators";
import {SidebarContentComponent} from "../../../../../shared/models/sidebar-props";
import {UntypedFormBuilder, UntypedFormGroup, Validator, Validators} from "@angular/forms";
import {Observable} from "rxjs";
import {SidebarService} from "../../../../../shared/services/sidebar.service";
import {JobPosting} from "../../../../../shared/models/job-posting";
import {Company} from "../../../../../shared/models/company";

@Component({
  selector: 'app-user-editing-form',
  templateUrl: './user-editing-form.component.html',
  styleUrls: ['./user-editing-form.component.scss']
})
export class UserEditingFormComponent extends SidebarContentComponent implements OnInit {

  readonly constant = Constants;

  isUpdate: boolean;
  formUser: UntypedFormGroup;

  @Input()
  readOnly = true;

  @Input()
  user: User;
  userCopie: User;
  isEditing = false;
 isSubmitted = false;
  users: User[] = [];
  constructor(
    private formBuilder: UntypedFormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private toasterService: ToasterService,
    private sidebarService: SidebarService,
  ) {
    super();
  }

  ngOnInit() : void {
    this.userService.getAll({...Constants.ALL_VALUE_PAGEABLE, sortBy: 'name'})
      .subscribe(data => {
        this.users = data.content;
      });
    this.user = this.sidebarInput ? {...this.sidebarInput.user } : undefined;
    this.isUpdate = !!this.sidebarInput?.user?.id;
    this.initForm(this.user);
  }

  private initForm(user: User): void {
    this.formUser = this.formBuilder
      .group({
        firstname : [user?.firstname ?? '',Validators.required],
        lastname : [user?.lastname ?? ''],
        email : [user?.email ?? ''],
        phoneNumber:[user?.phoneNumber ?? ''],
        birthday : [user?.birthday ?? ''],
        presentation : [user?.presentation ?? ''],
        hobbies : [user?.hobbies ?? ''],
        purpose : [user?.purpose ?? ''],
        expectation : [user?.expectation ?? ''],
        contribution : [user?.contribution ?? ''],

      })
  }

  onFileChange(event): void {
    const reader = new FileReader();

    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);

      reader.onload = () => {
        this.user.imageUrl = reader.result as string;
        const formData = new FormData();
        formData.set('file', file, file.filename);
        this.userService
          .updateUserImage(formData)
          .subscribe(
            user => {
              this.authService.setCurrentUser(user);
              // on "valide" le changement d'image en mettant à jour la valeur userCopie.imageUrl de sorte que si on
              // rollback les modifications de l'utilisateur, l'image soit tjs affichée
              this.userCopie.imageUrl = this.user.imageUrl;
            },
            () => {
              this.toasterService.error('Oops', 'Une erreur est survenue lors de la modification de votre image de profil');
              // on on rollback l'image de l'utilisateur
              this.user.imageUrl = this.userCopie.imageUrl;
            },
            () => this.toasterService.success('Succès', 'Votre image de profil a été mise à jour avec succès.')
          );
      };
    }
  }
  onSubmit(): void{
    this.isSubmitted = true ;
    if (this.formUser.invalid) {
      return;
    }

    const user :User = {...this.formUser.value};
    let user$ : Observable<User>;

    if(this.isUpdate) {
      user.id = this.sidebarInput.user.id;
      user$ = this.userService.updateUser(user);

    }
      user$.subscribe(
        userUpdate =>{
          if(this.isUpdate){
            this.updateFields(userUpdate);
            console.log("testt ===>> " + JSON.stringify( userUpdate))
          }
        },
        () => {
          const action = this.isUpdate ? 'la mise à jour' : `l'ajout`;
          this.toasterService.error('Oops', `Une erreur est survenue lors de ${action} de votre expérience.`);
        },
        () => {
          const action = this.isUpdate ? 'mise à jour' : 'créée';
          this.toasterService.success('Succès', `L'utilisateur a été ${action} avec succès.`);
          this.sidebarService.close();
        }
      )
    }

  private updateFields(userUpdate: User): void {
    this.sidebarInput.user.firstname = userUpdate.firstname;
    this.sidebarInput.user.lastname = userUpdate.lastname;
    this.sidebarInput.user.email = userUpdate.email;
    this.sidebarInput.user.phoneNumber = userUpdate.phoneNumber;
    this.sidebarInput.user.birthday = userUpdate.birthday;
    this.sidebarInput.user.presentation = userUpdate.presentation;
    this.sidebarInput.user.hobbies = userUpdate.hobbies;
    this.sidebarInput.user.purpose = userUpdate.purpose;
    this.sidebarInput.user.expectation = userUpdate.expectation;
    this.sidebarInput.user.contribution = userUpdate.contribution;
  }

}
