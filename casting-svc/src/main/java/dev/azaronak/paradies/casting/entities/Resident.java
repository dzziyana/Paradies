package dev.azaronak.paradies.casting.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import java.time.LocalDate;
import java.util.UUID;

@Entity
public class Resident extends PanacheEntityBase {
    @Id
    UUID id;
    String name;
    LocalDate birthday;
    String roomNumber;

    @Column(unique = true)
    String email;

    String phone;

    @JsonIgnore
    String passwordHash;

    @Column(columnDefinition = "TEXT")
    @JsonIgnore
    String profilePicture;
    String profilePictureMimeType;

    /** One-time token used for initial account setup (set password). Null once used. */
    @JsonIgnore
    String inviteToken;

    boolean subletting;

    public static Resident create(String name, LocalDate birthday, String roomNumber, String email) {
        Resident r = new Resident();
        r.id = UUID.randomUUID();
        r.name = name;
        r.birthday = birthday;
        r.roomNumber = roomNumber;
        r.email = email;
        r.inviteToken = UUID.randomUUID().toString();
        r.subletting = false;
        return r;
    }

    protected Resident() {}

    public UUID getId() { return id; }
    public String getName() { return name; }
    public LocalDate getBirthday() { return birthday; }
    public String getRoomNumber() { return roomNumber; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getProfilePicture() { return profilePicture; }
    public String getProfilePictureMimeType() { return profilePictureMimeType; }
    public String getInviteToken() { return inviteToken; }
    public boolean isSubletting() { return subletting; }
    public boolean isAccountSetUp() { return passwordHash != null; }

    public void updateInfo(String name, LocalDate birthday, String roomNumber, String email) {
        this.name = name;
        this.birthday = birthday;
        this.roomNumber = roomNumber;
        this.email = email;
    }

    public void setPhone(String phone) { this.phone = phone; }
    public void setPasswordHash(String hash) { this.passwordHash = hash; }
    public void clearInviteToken() { this.inviteToken = null; }
    public String generateResetToken() {
        this.inviteToken = UUID.randomUUID().toString();
        return this.inviteToken;
    }
    public void setProfilePicture(String pic, String mime) {
        this.profilePicture = pic;
        this.profilePictureMimeType = mime;
    }
    @JsonIgnore
    public String getPasswordHash() { return passwordHash; }
}
