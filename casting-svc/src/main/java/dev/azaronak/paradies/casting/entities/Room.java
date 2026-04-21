package dev.azaronak.paradies.casting.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import java.util.UUID;

@Entity
public class Room extends PanacheEntityBase {
    @Id
    UUID id;
    String roomNumber;
    int floor;
    double sizeM2;
    @Column(columnDefinition = "TEXT")
    String description;
    @Column(columnDefinition = "TEXT")
    String photo;
    String photoMimeType;

    public static Room create(String roomNumber, int floor, double sizeM2, String description, String photo, String photoMimeType) {
        Room r = new Room();
        r.id = UUID.randomUUID();
        r.roomNumber = roomNumber;
        r.floor = floor;
        r.sizeM2 = sizeM2;
        r.description = description;
        r.photo = photo;
        r.photoMimeType = photoMimeType;
        return r;
    }

    protected Room() {}

    public UUID getId() { return id; }
    public String getRoomNumber() { return roomNumber; }
    public int getFloor() { return floor; }
    public double getSizeM2() { return sizeM2; }
    public String getDescription() { return description; }
    public String getPhoto() { return photo; }
    public String getPhotoMimeType() { return photoMimeType; }
}