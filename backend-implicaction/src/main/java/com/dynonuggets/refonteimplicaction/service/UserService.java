package com.dynonuggets.refonteimplicaction.service;

import com.dynonuggets.refonteimplicaction.adapter.GroupAdapter;
import com.dynonuggets.refonteimplicaction.adapter.UserAdapter;
import com.dynonuggets.refonteimplicaction.dto.GroupDto;
import com.dynonuggets.refonteimplicaction.dto.RelationTypeEnum;
import com.dynonuggets.refonteimplicaction.dto.UserDto;
import com.dynonuggets.refonteimplicaction.exception.UnauthorizedException;
import com.dynonuggets.refonteimplicaction.exception.UserNotFoundException;
import com.dynonuggets.refonteimplicaction.model.*;
import com.dynonuggets.refonteimplicaction.repository.*;
import com.dynonuggets.refonteimplicaction.utils.Message;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static java.util.Collections.emptySet;
import static java.util.stream.Collectors.toList;

@Service
@AllArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RelationRepository relationRepository;
    private final AuthService authService;
    private final UserAdapter userAdapter;
    private final JobSeekerRepository jobSeekerRepository;
    private final CloudService cloudService;
    private final FileRepository fileRepository;
    private final GroupRepository groupRepository;
    private GroupAdapter groupAdapter;

    /**
     * @return la liste paginée de tous les utilisateurs
     */
    @Transactional(readOnly = true)
    public Page<UserDto> getAll(Pageable pageable) {
        return userRepository.findAll(pageable).map(userAdapter::toDto);
    }


    /**
     * @return la liste paginée de tous les utilisateurs (recruiters et job-seekers) dont l'inscription a été
     * validée
     */
    @Transactional(readOnly = true)
    public Page<UserDto> getAllCommunity(Pageable pageable) {
        final Long currentUserId = authService.getCurrentUser().getId();

        final Page<UserDto> users = userRepository.findAllForCommunity(pageable, currentUserId)
                .map(userAdapter::toDto);

        final List<Long> userIds = users.map(UserDto::getId)
                .get()
                .collect(toList());
        // on recherche les relations de tous les utilisateurs remontés avec l'utilisateur courant ...
        List<Relation> relations = relationRepository.findAllRelatedToUserByUserIdIn(currentUserId, userIds);
        // ... et on associe chaque relation avec un statut
        relations.forEach(relation -> users.stream()
                .filter(user -> isSenderOrReceiver(relation, user.getId()) && !currentUserId.equals(user.getId()))
                .findFirst()
                .ifPresent(user -> user.setRelationTypeOfCurrentUser(getRelationType(relation, currentUserId))));
        return users;
    }

    public UserDto getUserById(Long userId) {
        JobSeeker jobSeeker = jobSeekerRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("No user found with id " + userId));
        return userAdapter.toDto(jobSeeker);
    }

    public UserDto updateUser(UserDto userDto) {
        User user = userRepository.findById(userDto.getId())
                .orElseThrow(() -> new UserNotFoundException("Impossible de mettre à jour" +
                        " les informations personelles; L'user avec l'id " + userDto.getId() + " n'existe pas."));
        // on attribue les valeurs des champs manquants à notre user présent dans la BD avec la conversion
        // vers le modèle de l'adapter des champs modifiés afin de mettre à jour le user entier directement dans la BD
        user = updateUserFromDto(userDto, user);
        User userUpdate = userRepository.save(user);

        return userAdapter.toDto(userUpdate);
    }

    private boolean isSenderOrReceiver(Relation relation, Long userId) {
        return userId.equals(relation.getReceiver().getId()) || userId.equals(relation.getSender().getId());
    }

    public Page<UserDto> getAllPendingActivationUsers(Pageable pageable) {
        return userRepository.findAllByActivatedAtIsNull(pageable)
                .map(userAdapter::toDto);
    }

    private RelationTypeEnum getRelationType(Relation relation, Long userId) {
        if (relation.getConfirmedAt() != null) {
            return RelationTypeEnum.FRIEND;
        }
        if (userId.equals(relation.getReceiver().getId())) {
            return RelationTypeEnum.RECEIVER;
        }
        if (userId.equals(relation.getSender().getId())) {
            return RelationTypeEnum.SENDER;
        }
        return RelationTypeEnum.NONE;
    }

    @Transactional
    public UserDto updateImageProfile(MultipartFile file) {
        final User currentUser = authService.getCurrentUser();
        final FileModel fileModel = cloudService.uploadImage(file);
        final FileModel fileSave = fileRepository.save(fileModel);
        currentUser.setImage(fileSave);
        final User save = userRepository.save(currentUser);
        return userAdapter.toDto(save);
    }

    @Transactional(readOnly = true)
    public List<GroupDto> getUserGroups(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(Message.USER_NOT_FOUND_MESSAGE));

        final List<Group> groups = user.getGroups();
        return groups.stream()
                .map(groupAdapter::toDto)
                .collect(toList());
    }

    public List<String> getAllUsersContaining(String userName) {
        List<User> users = userRepository.findAllByUsernameContaining(userName);

        return users.stream()
                .map(User::getUsername)
                .collect(toList());
    }

    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username).orElseThrow(
                () -> new UserNotFoundException(Message.USER_NOT_FOUND_MESSAGE));

        return userAdapter.toDto(user);
    }

    public UserDto updateRoleOfUser(UserDto userDto) {
        boolean isAdmin = authService.isAdmin();
        if (!isAdmin) {
            throw new UnauthorizedException("Vous avez pas le droit de modifier");
        }
        User user = userRepository.findById(userDto.getId())
                .orElseThrow(() -> new UserNotFoundException("Impossible de mettre à jour" +
                        " les informations personelles; L'user avec l'id " + userDto.getId() + " n'existe pas."));
        // on attribue les valeurs des champs manquants à notre user présent dans la BD avec la conversion
        // vers le modèle de l'adapter des champs modifiés afin de mettre à jour le user entier directement dans la BD
        final List<Role> roles = userDto.getRoles()
                .stream()
                .map(roleLabel -> {
                    final RoleEnum role = RoleEnum.byLongName(roleLabel);
                    return new Role(role.getId(), role.getLongName(), emptySet());
                })
                .collect(toList());
        user.setRoles(roles);
        user = updateUserFromDto(userDto, user);
        User userUpdate = userRepository.save(user);
        return userAdapter.toDto(userUpdate);
    }

    private User updateUserFromDto(UserDto userDto, User user) {
        user.setLastname(userDto.getLastname());
        user.setFirstname(userDto.getFirstname());
        user.setEmail(userDto.getEmail());
        user.setPhoneNumber(userDto.getPhoneNumber());
        user.setBirthday(userDto.getBirthday());
        user.setHobbies(userDto.getHobbies());
        user.setPresentation(userDto.getPresentation());
        user.setPurpose(userDto.getPurpose());
        user.setContribution(userDto.getContribution());
        user.setExpectation(userDto.getExpectation());

        return user;
    }

    public List<UserDto> getNbOfUsers(){
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(userAdapter::toDto)
                .collect(toList());
    }

    public void deleteUser(Long userId) {
        //userRepository.deleteById(userId);
        System.out.println("testt supprimer " + userId);
    }
}
