package dev.azaronak.paradies.casting.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class Session extends PanacheEntityBase {
    @Id
    String token;

    @ManyToOne
    Resident resident;

    LocalDateTime createdAt;
    LocalDateTime expiresAt;

    public static Session create(Resident resident) {
        Session s = new Session();
        s.token = UUID.randomUUID().toString();
        s.resident = resident;
        s.createdAt = LocalDateTime.now();
        s.expiresAt = LocalDateTime.now().plusDays(30);
        return s;
    }

    protected Session() {}

    public String getToken() { return token; }
    public Resident getResident() { return resident; }
    public boolean isExpired() { return LocalDateTime.now().isAfter(expiresAt); }
}
