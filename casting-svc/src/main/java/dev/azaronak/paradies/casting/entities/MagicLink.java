package dev.azaronak.paradies.casting.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class MagicLink extends PanacheEntityBase {
    @Id
    String token;

    @ManyToOne
    Application application;

    @ManyToOne
    Casting casting;

    LocalDateTime createdAt;
    LocalDateTime expiresAt;

    public static MagicLink create(Application application, Casting casting) {
        MagicLink ml = new MagicLink();
        ml.token = UUID.randomUUID().toString();
        ml.application = application;
        ml.casting = casting;
        ml.createdAt = LocalDateTime.now();
        ml.expiresAt = LocalDateTime.now().plusDays(90);
        return ml;
    }

    protected MagicLink() {}

    public String getToken() { return token; }
    public Application getApplication() { return application; }
    public Casting getCasting() { return casting; }
    public boolean isExpired() { return LocalDateTime.now().isAfter(expiresAt); }
}
