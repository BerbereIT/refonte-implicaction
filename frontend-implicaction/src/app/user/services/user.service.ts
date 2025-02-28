import {Injectable} from '@angular/core';
import {ApiHttpService} from '../../core/services/api-http.service';
import {ApiEndpointsService} from '../../core/services/api-endpoints.service';
import {Observable} from 'rxjs';
import {User} from '../../shared/models/user';
import {Pageable} from '../../shared/models/pageable';
import {HttpClient} from '@angular/common/http';
import {Relation} from '../models/relation';
import {Group} from '../../discussion/model/group';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private http: HttpClient,
    private apiHttpService: ApiHttpService,
    private apiEndpointsService: ApiEndpointsService
  ) {

  }

  getAll(pageable: Pageable<any>): Observable<any> {
    return this.http.get(this.apiEndpointsService.getAllUserEndpoint(pageable));
  }

  getAllCommunity(pageable: Pageable<User>): Observable<any> {
    return this.http.get(this.apiEndpointsService.getAllUserCommunityEndpoint(pageable));
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get(this.apiEndpointsService.getUserByIdEndpoint(userId));
  }

  getUserFriends(userId: string, pageable: Pageable<any>): Observable<any> {
    return this.http.get<Pageable<User>>(this.apiEndpointsService.getAllFriendsByUserIdEndPoint(userId, pageable));
  }

  getUserFriendRequestReceived(pageable: Pageable<any>): Observable<any> {
    return this.http.get<Pageable<User>>(this.apiEndpointsService.getFriendRequestReceivedEndpoint(pageable));
  }

  getUserFriendRequestSent(pageable: Pageable<any>): Observable<any> {
    return this.http.get<Pageable<User>>(this.apiEndpointsService.getFriendRequestSentEndPoint(pageable));
  }

  confirmUserAsFriend(senderId: string): Observable<Relation> {
    return this.http.get(this.apiEndpointsService.confirmUserAsFriendEndpoint(senderId));
  }

  removeUserFromFriends(userId: string): Observable<any> {
    return this.http.delete(this.apiEndpointsService.cancelRelationByUserEndpoint(userId));
  }

  updateUser(user: User): Observable<any> {
    return this.http.put<User>(this.apiEndpointsService.updateUserEndpoint(), user);
  }

  updateRoleOfUser(user: User): Observable<any> {
    return this.http.put<User>(this.apiEndpointsService.updateRoleOfUserEndpoint(), user);
  }

  getAllPendingActivationUsers(pageable: Pageable<User>): Observable<any> {
    return this.http.get(this.apiEndpointsService.getAllPendingActivationUsersEndpoint(pageable));
  }

  updateUserImage(formData: FormData): Observable<User> {
    return this.http.post<User>(this.apiEndpointsService.updateImageProfileEndpoint(), formData);
  }

  getUserGroups(userId: string): Observable<Group[]> {
    return this.http.get<Group[]>(this.apiEndpointsService.getAllGroups(userId));
  }

  getNbOfUsers():Observable<any>{
    return this.http.get<any>(this.apiEndpointsService.getNbOfUsers())
  }

  getAllUsernameMatching(userName: string): Observable<string[]> {
    return this.http.get<string[]>(this.apiEndpointsService.getUserName(userName))
  }

  getUserByUsername(userName: string): Observable<User> {
    return this.http.get<User>(this.apiEndpointsService.getUserByUsername(userName))
  }
}
